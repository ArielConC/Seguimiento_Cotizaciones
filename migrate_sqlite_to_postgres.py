from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


DEFAULT_SOURCE_HASH = "3CEA3DC09C3CDE0D81D8B36BB857A3689F13E9E04BFCC8AB6F8D538F5FA85BD7"

PARENT_FIRST = (
    "settings",
    "distributor_catalog",
    "distributor_unmatched",
    "users",
    "quotes",
    "special_quotes",
    "imports",
    "import_payloads",
    "special_imports",
    "special_daily_notes",
    "scan_runs",
    "processed_files",
    "daily_notes",
    "backup_runs",
    "invoice_import_batches",
    "quote_events",
    "quote_comments",
    "quote_invoices",
    "special_quote_events",
    "special_quote_comments",
    "special_quote_invoices",
    "po_invoices",
    "sessions",
    "audit_log",
)

CHILD_FIRST = tuple(reversed(PARENT_FIRST))
BUSINESS_TABLES = (
    "quotes",
    "special_quotes",
    "quote_events",
    "special_quote_events",
    "quote_comments",
    "special_quote_comments",
    "quote_invoices",
    "special_quote_invoices",
    "imports",
    "audit_log",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def source_connection(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def source_tables(connection: sqlite3.Connection) -> list[str]:
    return [
        str(row[0])
        for row in connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
    ]


def source_columns(connection: sqlite3.Connection, table: str) -> list[str]:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table):
        raise ValueError("Invalid source table")
    return [str(row["name"]) for row in connection.execute(f'PRAGMA table_info("{table}")').fetchall()]


def target_columns(connection, table: str) -> list[str]:
    return [
        str(row["column_name"])
        for row in connection.execute(
            """SELECT column_name FROM information_schema.columns
            WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position""",
            (table,),
        ).fetchall()
    ]


def initialize_target() -> None:
    import auth
    import backup
    import database
    import invoice_manager
    import special

    database.initialize()
    special.initialize()
    auth.initialize()
    invoice_manager.initialize()
    backup.initialize()


def ensure_seed_only(connection) -> None:
    populated: dict[str, int] = {}
    for table in BUSINESS_TABLES:
        count = int(connection.execute(f"SELECT COUNT(*) AS value FROM {table}").fetchone()["value"])
        if count:
            populated[table] = count
    if populated:
        raise RuntimeError(
            "The Neon target already contains business data. Migration stopped to prevent overwriting: "
            + json.dumps(populated, sort_keys=True)
        )
    users = connection.execute(
        "SELECT username,password_hash FROM users ORDER BY username"
    ).fetchall()
    if any(str(row["password_hash"] or "") for row in users):
        raise RuntimeError("The Neon target already contains configured user passwords; migration stopped")


def clear_seed(connection, available: set[str]) -> None:
    for table in CHILD_FIRST:
        if table in available:
            connection.execute(f"DELETE FROM {table}")


def copy_table(source: sqlite3.Connection, target, table: str) -> dict[str, Any]:
    source_names = source_columns(source, table)
    target_names = target_columns(target, table)
    columns = [name for name in source_names if name in target_names]
    if not columns:
        return {"source": 0, "target": 0, "columns": 0, "skipped": True}
    quoted = ",".join(f'"{name}"' for name in columns)
    rows = source.execute(f'SELECT {quoted} FROM "{table}"').fetchall()
    marks = ",".join("?" for _ in columns)
    statement = f"INSERT INTO {table}({quoted}) VALUES({marks})"
    for row in rows:
        target.execute(statement, tuple(row[name] for name in columns))
    target_count = int(target.execute(f"SELECT COUNT(*) AS value FROM {table}").fetchone()["value"])
    if target_count != len(rows):
        raise RuntimeError(f"Count mismatch for {table}: source={len(rows)}, target={target_count}")
    return {"source": len(rows), "target": target_count, "columns": len(columns), "skipped": False}


def reset_identity(connection, table: str) -> None:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table):
        raise ValueError("Invalid target table")
    sequence = connection.execute(
        "SELECT pg_get_serial_sequence(?, 'id') AS value", (table,)
    ).fetchone()["value"]
    if not sequence:
        return
    maximum = connection.execute(f"SELECT MAX(id) AS value FROM {table}").fetchone()["value"]
    if maximum is None:
        connection.execute("SELECT setval(CAST(? AS regclass),1,false)", (sequence,))
    else:
        connection.execute("SELECT setval(CAST(? AS regclass),?,true)", (sequence, int(maximum)))


def verify_known_records(connection) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for folio in ("QT-11966", "QT-12004", "QT-12089"):
        row = connection.execute(
            "SELECT folio,status,customer_order,po_date,po_total_usd FROM quotes WHERE folio=?", (folio,)
        ).fetchone()
        results[folio] = dict(row) if row else None
    return results


def migrate(source_path: Path) -> dict[str, Any]:
    import database
    import db_backend

    if not db_backend.is_postgres():
        raise RuntimeError("DATABASE_URL must point to Neon before applying the migration")
    initialize_target()
    source = source_connection(source_path)
    try:
        source_names = source_tables(source)
        with database.connect() as target:
            target_names = {
                str(row["table_name"])
                for row in target.execute(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
                ).fetchall()
            }
            ensure_seed_only(target)
            clear_seed(target, target_names)
            report: dict[str, Any] = {}
            for table in PARENT_FIRST:
                if table in source_names and table in target_names:
                    report[table] = copy_table(source, target, table)
            missing = sorted(set(source_names) - target_names)
            if missing:
                raise RuntimeError("Target schema is missing source tables: " + ", ".join(missing))
            for table in PARENT_FIRST:
                if table in target_names and "id" in target_columns(target, table):
                    reset_identity(target, table)
            known = verify_known_records(target)
        return {
            "completed_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "source": str(source_path.resolve()),
            "source_sha256": sha256(source_path),
            "tables": report,
            "known_records": known,
        }
    finally:
        source.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Safely migrate the quotation SQLite backup to Neon PostgreSQL")
    parser.add_argument("--source", required=True, type=Path, help="Path to the SQLite backup")
    parser.add_argument("--expected-sha256", default=DEFAULT_SOURCE_HASH)
    parser.add_argument("--apply", action="store_true", help="Required to write to the configured Neon database")
    parser.add_argument("--report", type=Path, help="Optional path for the JSON reconciliation report")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.source.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    actual_hash = sha256(source)
    if args.expected_sha256 and actual_hash != args.expected_sha256.upper():
        raise RuntimeError(f"Source SHA-256 mismatch: expected {args.expected_sha256}, found {actual_hash}")
    with source_connection(source) as connection:
        integrity = str(connection.execute("PRAGMA integrity_check").fetchone()[0])
        inventory = {
            table: int(connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0])
            for table in source_tables(connection)
        }
    preview = {"source": str(source), "sha256": actual_hash, "integrity": integrity, "tables": inventory}
    if integrity != "ok":
        raise RuntimeError(f"SQLite integrity check failed: {integrity}")
    if not args.apply:
        print(json.dumps({**preview, "mode": "dry-run", "message": "No target data was changed"}, indent=2))
        return 0
    if not os.environ.get("DATABASE_URL", "").strip():
        raise RuntimeError("Set DATABASE_URL in the current terminal before using --apply")
    result = migrate(source)
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
        print(f"Migration failed safely: {exc}", file=sys.stderr)
        raise SystemExit(1)
