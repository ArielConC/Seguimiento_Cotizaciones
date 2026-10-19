from __future__ import annotations

import hashlib
import base64
import json
import re
import secrets
from datetime import datetime
from pathlib import Path
from typing import Any

import auth
import database
import special
import db_backend


def _safe_name(filename: str) -> str:
    name = Path(filename).name
    return re.sub(r"[^A-Za-z0-9._ -]+", "_", name)[:160] or "quotations.xlsx"


def preview(workspace: str, content: bytes, filename: str, user: dict[str, Any]) -> dict[str, Any]:
    if workspace not in {"standard", "special"}:
        raise ValueError("Invalid workspace")
    if user.get("role") == "readonly":
        raise PermissionError("Read-only users cannot import files")
    filename = _safe_name(filename)
    result = database.preview_workbook(content, filename) if workspace == "standard" else special.preview_workbook(content, filename)
    token = secrets.token_urlsafe(24)
    suffix = Path(filename).suffix.casefold()
    stored: Path | None = None
    stored_path = f"database://imports/{token}"
    if not db_backend.is_postgres():
        pending = database.IMPORT_DIR / "pending"
        pending.mkdir(parents=True, exist_ok=True)
        stored = pending / f"{token}{suffix if suffix in {'.xlsx','.txt'} else '.bin'}"
        stored.write_bytes(content)
        stored_path = str(stored)
    file_hash = hashlib.sha256(content).hexdigest()
    with database.connect() as db:
        cursor = db.execute(
            """INSERT INTO imports(token,workspace,filename,stored_path,file_hash,status,rows_seen,inserted,updated,
            duplicates,archived,errors,error_detail,preview_json,user_id,user_name,created_at)
            VALUES(?,?,?,?,?,'preview',?,0,?,?,?,?,?,?,?,?,?)""",
            (token,workspace,filename,stored_path,file_hash,result["rows_seen"],result["updated"],result["duplicates"],
             result.get("archived",0),result["errors"],json.dumps(result.get("error_detail",[]),ensure_ascii=False),
             json.dumps(result,ensure_ascii=False,default=str),user["id"],user["display_name"],database.now_iso()),
        )
        import_id=int(cursor.lastrowid)
        if db_backend.is_postgres():
            db.execute(
                "INSERT INTO import_payloads(token,content_base64,created_at) VALUES(?,?,?)",
                (token,base64.b64encode(content).decode("ascii"),database.now_iso()),
            )
    auth.audit(user,"import_previewed",workspace,"import",str(import_id),f"{filename}: {result['rows_seen']} rows")
    return {**result,"token":token,"import_id":import_id,"filename":filename,"file_hash":file_hash}


def confirm(workspace: str, token: str, user: dict[str, Any]) -> dict[str, Any]:
    if user.get("role") == "readonly": raise PermissionError("Read-only users cannot import files")
    with database.connect() as db:
        row=db.execute("SELECT * FROM imports WHERE token=? AND workspace=?",(token,workspace)).fetchone()
    if not row: raise KeyError("Import preview not found")
    if row["status"] != "preview": raise ValueError("This import has already been processed")
    if row["user_id"] != user["id"] and not auth.can_admin(user): raise PermissionError("This preview belongs to another user")
    path: Path | None = None
    if db_backend.is_postgres():
        with database.connect() as db:
            payload=db.execute("SELECT content_base64 FROM import_payloads WHERE token=?",(token,)).fetchone()
        if not payload: raise FileNotFoundError("The temporary import file is no longer available")
        content=base64.b64decode(str(payload["content_base64"]),validate=True)
    else:
        path=Path(row["stored_path"])
        if not path.is_file(): raise FileNotFoundError("The temporary import file is no longer available")
        content=path.read_bytes()
    result=database.import_workbook(content,row["filename"],user,row["id"]) if workspace=="standard" else special.import_workbook(content,row["filename"],user,row["id"])
    now=datetime.now().astimezone()
    if db_backend.is_postgres():
        target=Path(f"database-import-{row['id']}-{_safe_name(row['filename'])}")
    else:
        archive_dir=database.IMPORT_DIR/workspace/str(now.year)/f"{now.month:02d}"
        archive_dir.mkdir(parents=True,exist_ok=True)
        target=archive_dir/f"{now:%Y%m%d_%H%M%S}_{row['id']}_{_safe_name(row['filename'])}"
        assert path is not None
        path.replace(target)
    with database.connect() as db:
        db.execute("""UPDATE imports SET stored_path=?,status='confirmed',rows_seen=?,inserted=?,updated=?,duplicates=?,
            archived=?,errors=?,error_detail=?,confirmed_at=? WHERE id=?""",
            (str(target),result["rows_seen"],result["inserted"],result["updated"],result.get("duplicates",0),
             result.get("archived",0),result["errors"],json.dumps(result.get("error_detail",[]),ensure_ascii=False),
             database.now_iso(),row["id"]))
        if db_backend.is_postgres():
            db.execute("DELETE FROM import_payloads WHERE token=?",(token,))
    auth.audit(user,"import_confirmed",workspace,"import",str(row["id"]),json.dumps(result,ensure_ascii=False,default=str))
    return {**result,"import_id":row["id"],"archive_path":str(target)}


def history(workspace: str, limit: int = 30) -> list[dict[str, Any]]:
    with database.connect() as db:
        rows=db.execute("SELECT id,workspace,filename,file_hash,status,rows_seen,inserted,updated,duplicates,archived,errors,user_name,created_at,confirmed_at FROM imports WHERE workspace=? ORDER BY id DESC LIMIT ?",(workspace,max(1,min(limit,100)))).fetchall()
    return database.rows_to_dicts(rows)
