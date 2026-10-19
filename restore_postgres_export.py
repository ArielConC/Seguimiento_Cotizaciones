from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

import migrate_sqlite_to_postgres as migration


EXPECTED_FORMAT = "quotation-follow-up-postgresql-jsonl-v1"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def read_export(path: Path) -> tuple[dict[str, Any], dict[str, list[dict[str, Any]]]]:
    with zipfile.ZipFile(path, "r") as archive:
        if archive.testzip() is not None:
            raise RuntimeError("The ZIP integrity check failed")
        try:
            manifest = json.loads(archive.read("manifest.json"))
        except KeyError as exc:
            raise RuntimeError("The export does not contain manifest.json") from exc
        if manifest.get("format") != EXPECTED_FORMAT:
            raise RuntimeError(f"Unsupported backup format: {manifest.get('format')!r}")
        declared = manifest.get("tables")
        if not isinstance(declared, dict):
            raise RuntimeError("The backup manifest has no valid table inventory")
        unsupported = sorted(set(declared) - set(migration.PARENT_FIRST))
        if unsupported:
            raise RuntimeError("The backup contains unsupported tables: " + ", ".join(unsupported))
        tables: dict[str, list[dict[str, Any]]] = {}
        for table, expected_count in declared.items():
            member = f"tables/{table}.jsonl"
            try:
                lines = archive.read(member).decode("utf-8").splitlines()
            except KeyError as exc:
                raise RuntimeError(f"The backup is missing {member}") from exc
            rows = [json.loads(line) for line in lines if line.strip()]
            if len(rows) != int(expected_count):
                raise RuntimeError(
                    f"Manifest count mismatch for {table}: expected={expected_count}, found={len(rows)}"
                )
            if any(not isinstance(row, dict) for row in rows):
                raise RuntimeError(f"Invalid row data in {member}")
            tables[table] = rows
    return manifest, tables


def restore(path: Path) -> dict[str, Any]:
    import database
    import db_backend

    if not db_backend.is_postgres():
        raise RuntimeError("DATABASE_URL must point to the PostgreSQL recovery target")
    manifest, exported = read_export(path)
    migration.initialize_target()
    with database.connect() as target:
        target_tables = {
            str(row["table_name"])
            for row in target.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
            ).fetchall()
        }
        migration.ensure_seed_only(target)
        migration.clear_seed(target, target_tables)
        counts: dict[str, int] = {}
        for table in migration.PARENT_FIRST:
            if table not in exported:
                continue
            if table not in target_tables:
                raise RuntimeError(f"The recovery target is missing table {table}")
            target_columns = migration.target_columns(target, table)
            rows = exported[table]
            for row in rows:
                columns = [name for name in target_columns if name in row]
                if not columns:
                    raise RuntimeError(f"No compatible columns found for {table}")
                quoted = ",".join(f'"{name}"' for name in columns)
                marks = ",".join("?" for _ in columns)
                target.execute(
                    f"INSERT INTO {table}({quoted}) VALUES({marks})",
                    tuple(row[name] for name in columns),
                )
            restored = int(target.execute(f"SELECT COUNT(*) AS value FROM {table}").fetchone()["value"])
            if restored != len(rows):
                raise RuntimeError(
                    f"Restore count mismatch for {table}: backup={len(rows)}, target={restored}"
                )
            counts[table] = restored
        for table in migration.PARENT_FIRST:
            if table in target_tables and "id" in migration.target_columns(target, table):
                migration.reset_identity(target, table)
        known_records = migration.verify_known_records(target)
    return {
        "completed_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source": str(path.resolve()),
        "source_sha256": sha256(path),
        "backup_created_at": manifest.get("created_at"),
        "tables": counts,
        "known_records": known_records,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Restore a logical app backup into an empty PostgreSQL database")
    parser.add_argument("--source", required=True, type=Path, help="Downloaded cotizaciones_*.zip backup")
    parser.add_argument("--expected-sha256", default="", help="Optional expected ZIP SHA-256")
    parser.add_argument("--apply", action="store_true", help="Required to write to PostgreSQL")
    parser.add_argument("--report", type=Path, help="Optional JSON reconciliation report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.source.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    actual_hash = sha256(source)
    if args.expected_sha256 and actual_hash != args.expected_sha256.upper():
        raise RuntimeError(f"Backup SHA-256 mismatch: expected {args.expected_sha256}, found {actual_hash}")
    manifest, tables = read_export(source)
    preview = {
        "source": str(source),
        "sha256": actual_hash,
        "backup_created_at": manifest.get("created_at"),
        "tables": {name: len(rows) for name, rows in tables.items()},
    }
    if not args.apply:
        print(json.dumps({**preview, "mode": "dry-run", "message": "No target data was changed"}, indent=2))
        return 0
    if not os.environ.get("DATABASE_URL", "").strip():
        raise RuntimeError("Set DATABASE_URL in the current terminal before using --apply")
    result = restore(source)
    payload = {**preview, "mode": "applied", "result": result}
    rendered = json.dumps(payload, ensure_ascii=False, indent=2, default=str)
    if args.report:
        args.report.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Restore failed safely: {exc}", file=sys.stderr)
        raise SystemExit(1)
