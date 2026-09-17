from __future__ import annotations

import os
import shutil
import sqlite3
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import database


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


def perform(user_name: str = "Automatic") -> dict[str, Any]:
    BACKUP_DIR.mkdir(parents=True,exist_ok=True)
    now=datetime.now().astimezone(); target=BACKUP_DIR/f"cotizaciones_{now:%Y%m%d_%H%M%S}.db"
    started=database.now_iso()
    with database.connect() as db:
        run_id=int(db.execute("INSERT INTO backup_runs(started_at,status,user_name) VALUES(?,'running',?)",(started,user_name)).lastrowid)
    try:
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
        _retain(BACKUP_DIR,"cotizaciones_*.db",30)
        with database.connect() as db:
            db.execute("UPDATE backup_runs SET finished_at=?,status='success',backup_path=?,external_path=?,verified=1 WHERE id=?",
                       (database.now_iso(),str(target),external_path,run_id))
        return {"ok":True,"path":str(target),"external_path":external_path,"verified":True,"finished_at":database.now_iso()}
    except Exception as exc:
        with database.connect() as db:
            db.execute("UPDATE backup_runs SET finished_at=?,status='error',detail=? WHERE id=?",(database.now_iso(),str(exc),run_id))
        return {"ok":False,"error":str(exc),"verified":False,"finished_at":database.now_iso()}


def status() -> dict[str, Any]:
    with database.connect() as db:
        row=db.execute("SELECT * FROM backup_runs ORDER BY id DESC LIMIT 1").fetchone()
    if not row: return {"status":"missing","overdue":True,"message":"No backup has been completed"}
    result=dict(row); finished=result.get("finished_at")
    result["overdue"] = not finished or datetime.fromisoformat(finished) < datetime.now().astimezone()-timedelta(hours=26) or result["status"]!="success"
    return result


def automatic_loop() -> None:
    while True:
        current=status()
        if current.get("overdue"):
            perform()
        time.sleep(3600)


def launch_automatic() -> None:
    threading.Thread(target=automatic_loop,name="automatic-backup",daemon=True).start()
