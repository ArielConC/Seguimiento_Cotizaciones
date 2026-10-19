from __future__ import annotations

import os
import shutil
import sqlite3
import threading
import time
import json
import re
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import database
import db_backend


BACKUP_DIR = database.DATA_DIR / "backups"


def initialize() -> None:
    with database.connect() as db:
        db.execute(
            """CREATE TABLE IF NOT EXISTS backup_runs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,started_at TEXT NOT NULL,finished_at TEXT,status TEXT NOT NULL,
            backup_path TEXT NOT NULL DEFAULT '',external_path TEXT NOT NULL DEFAULT '',verified INTEGER NOT NULL DEFAULT 0,
            detail TEXT NOT NULL DEFAULT '',user_name TEXT NOT NULL DEFAULT 'Automatic')"""
        )


def _verify(path: Path) -> bool:
    connection=sqlite3.connect(path)
    try:
        return connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    finally:
        connection.close()


def _retain(folder: Path, pattern: str, keep: int) -> None:
    files=sorted(folder.glob(pattern),key=lambda p:p.stat().st_mtime,reverse=True)
    for old in files[keep:]:
        old.unlink(missing_ok=True)


def _postgres_export(target: Path) -> bool:
    """Create a portable logical snapshot without relying on Render's filesystem."""
    with database.connect() as db:
        tables = [
            str(row["table_name"])
            for row in db.execute(
                """SELECT table_name FROM information_schema.tables
                WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"""
            ).fetchall()
        ]
        manifest: dict[str, Any] = {
            "format": "quotation-follow-up-postgresql-jsonl-v1",
            "created_at": database.now_iso(),
            "tables": {},
        }
        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for table in tables:
                if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table):
                    raise RuntimeError(f"Unsupported PostgreSQL table name: {table!r}")
                rows = database.rows_to_dicts(db.execute(f"SELECT * FROM {table}").fetchall())
                content = "".join(json.dumps(row, ensure_ascii=False, default=str) + "\n" for row in rows)
                archive.writestr(f"tables/{table}.jsonl", content.encode("utf-8"))
                manifest["tables"][table] = len(rows)
            archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"))
    with zipfile.ZipFile(target, "r") as archive:
        return archive.testzip() is None and "manifest.json" in archive.namelist()


def perform(user_name: str = "Automatic") -> dict[str, Any]:
    BACKUP_DIR.mkdir(parents=True,exist_ok=True)
    now=datetime.now().astimezone()
    suffix=".zip" if db_backend.is_postgres() else ".db"
    target=BACKUP_DIR/f"cotizaciones_{now:%Y%m%d_%H%M%S}{suffix}"
    started=database.now_iso()
    with database.connect() as db:
        run_id=int(db.execute("INSERT INTO backup_runs(started_at,status,user_name) VALUES(?,'running',?)",(started,user_name)).lastrowid)
    try:
        if db_backend.is_postgres():
            verified=_postgres_export(target)
        else:
            source=sqlite3.connect(database.DB_PATH)
            destination=sqlite3.connect(target)
            try: source.backup(destination)
            finally: destination.close(); source.close()
            verified=_verify(target)
        if not verified: raise RuntimeError("Backup integrity verification failed")
        external_path=""; configured=os.environ.get("NT_QUOTE_BACKUP_DIR","").strip()
        if configured:
            external_dir=Path(configured); external_dir.mkdir(parents=True,exist_ok=True)
            external=external_dir/target.name; shutil.copy2(target,external); external_path=str(external)
        _retain(BACKUP_DIR,f"cotizaciones_*{suffix}",30)
        with database.connect() as db:
            db.execute("UPDATE backup_runs SET finished_at=?,status='success',backup_path=?,external_path=?,verified=1 WHERE id=?",
                       (database.now_iso(),str(target),external_path,run_id))
        return {"ok":True,"path":str(target),"external_path":external_path,"verified":True,
                "backend":db_backend.backend_name(),"download_required":db_backend.is_postgres(),"finished_at":database.now_iso()}
    except Exception as exc:
        with database.connect() as db:
            db.execute("UPDATE backup_runs SET finished_at=?,status='error',detail=? WHERE id=?",(database.now_iso(),str(exc),run_id))
        return {"ok":False,"error":str(exc),"verified":False,"finished_at":database.now_iso()}


def status() -> dict[str, Any]:
    with database.connect() as db:
        if db_backend.is_postgres():
            row=db.execute("SELECT * FROM backup_runs WHERE backup_path LIKE '%.zip' ORDER BY id DESC LIMIT 1").fetchone()
        else:
            row=db.execute("SELECT * FROM backup_runs ORDER BY id DESC LIMIT 1").fetchone()
    if not row and db_backend.is_postgres():
        return {"status":"managed","overdue":False,"backend":"postgresql",
                "message":"Data is stored in Neon. Generate and download a logical backup when required."}
    if not row: return {"status":"missing","overdue":True,"message":"No backup has been completed"}
    result=dict(row); finished=result.get("finished_at")
    result["overdue"] = not finished or datetime.fromisoformat(finished) < datetime.now().astimezone()-timedelta(hours=26) or result["status"]!="success"
    return result


def latest_download() -> tuple[bytes, str]:
    pattern="cotizaciones_*.zip" if db_backend.is_postgres() else "cotizaciones_*.db"
    files=sorted(BACKUP_DIR.glob(pattern),key=lambda path:path.stat().st_mtime,reverse=True)
    if not files:
        result=perform("Download request")
        if not result.get("ok"):
            raise RuntimeError(str(result.get("error") or "Backup could not be generated"))
        files=[Path(str(result["path"]))]
    latest=files[0]
    return latest.read_bytes(),latest.name


def automatic_loop() -> None:
    while True:
        current=status()
        if current.get("overdue"):
            perform()
        time.sleep(3600)


def launch_automatic() -> None:
    if db_backend.is_postgres():
        return
    threading.Thread(target=automatic_loop,name="automatic-backup",daemon=True).start()
