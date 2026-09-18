from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta
from typing import Any

import database


SESSION_HOURS = 8
PBKDF2_ITERATIONS = 310_000
ADMIN_ROLES = {"superadmin", "secretadmin"}
TEAM_REPORT_ROLES = {"superadmin", "secretadmin", "supervisor"}
VALID_ROLES = {"user", "supervisor", "readonly", "superadmin", "secretadmin"}
INITIAL_USERS = (
    ("takujiyamada", "TAKUJI YAMADA", "superadmin", "TAKUJI YAMADA"),
    ("ignacioillescas", "IGNACIO ILLESCAS", "superadmin", "IGNACIO ILLESCAS"),
    ("eleonorbarragan", "ELEONOR BARRAGAN", "user", "ELEONOR BARRAGAN"),
    ("arielcontreras", "ARIEL CONTRERAS", "secretadmin", "ARIEL CONTRERAS"),
)


def initialize() -> None:
    with database.connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL,
                agent_name TEXT NOT NULL DEFAULT '',
                language TEXT NOT NULL DEFAULT 'en',
                password_salt TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL DEFAULT '',
                must_change_password INTEGER NOT NULL DEFAULT 1,
                failed_attempts INTEGER NOT NULL DEFAULT 0,
                locked_until TEXT,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                csrf_token TEXT NOT NULL,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL,
                ip_address TEXT NOT NULL DEFAULT '',
                user_agent TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_name TEXT NOT NULL DEFAULT '',
                action TEXT NOT NULL,
                workspace TEXT NOT NULL DEFAULT '',
                entity_type TEXT NOT NULL DEFAULT '',
                entity_id TEXT NOT NULL DEFAULT '',
                detail TEXT NOT NULL DEFAULT '',
                emergency_admin INTEGER NOT NULL DEFAULT 0,
                ip_address TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
            """
        )
        now = database.now_iso()
        for username, name, role, agent in INITIAL_USERS:
            db.execute(
                """INSERT OR IGNORE INTO users(username,display_name,role,agent_name,created_at,updated_at)
                VALUES(?,?,?,?,?,?)""",
                (username, name, role, agent, now, now),
            )


def _hash_password(password: str, salt_hex: str | None = None) -> tuple[str, str]:
    if len(password) < 10:
        raise ValueError("Password must contain at least 10 characters")
    salt = bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return salt.hex(), digest.hex()


def _public(row: Any, csrf_token: str = "") -> dict[str, Any]:
    user = dict(row)
    for key in ("password_salt", "password_hash", "failed_attempts", "locked_until"):
        user.pop(key, None)
    user["can_admin_users"] = user["role"] in ADMIN_ROLES
    user["can_team_reports"] = user["role"] in TEAM_REPORT_ROLES
    user["can_edit"] = user["role"] != "readonly"
    user["can_view_audit"] = user["role"] == "secretadmin"
    user["management_profile"] = str(user.get("username") or "").casefold() == "takujiyamada"
    if csrf_token:
        user["csrf_token"] = csrf_token
    return user


def bootstrap_needed() -> bool:
    with database.connect() as db:
        return db.execute("SELECT COUNT(*) AS value FROM users WHERE password_hash<>''").fetchone()["value"] == 0


def _create_session(db, user_id: int, ip: str, user_agent: str) -> tuple[str, str]:
    token = secrets.token_urlsafe(40)
    csrf = secrets.token_urlsafe(28)
    now = datetime.now().astimezone()
    expires = now + timedelta(hours=SESSION_HOURS)
    db.execute(
        "INSERT INTO sessions(token_hash,csrf_token,user_id,created_at,expires_at,last_seen_at,ip_address,user_agent) VALUES(?,?,?,?,?,?,?,?)",
        (hashlib.sha256(token.encode()).hexdigest(), csrf, user_id, now.isoformat(timespec="seconds"),
         expires.isoformat(timespec="seconds"), now.isoformat(timespec="seconds"), ip, user_agent[:300]),
    )
    return token, csrf


def bootstrap(username: str, password: str, language: str, ip: str = "", user_agent: str = "") -> tuple[dict[str, Any], str]:
    if not bootstrap_needed():
        raise ValueError("Initial setup has already been completed")
    language = language if language in {"en", "es"} else "en"
    salt, digest = _hash_password(password)
    with database.connect() as db:
        db.execute("BEGIN IMMEDIATE")
        user = db.execute("SELECT * FROM users WHERE username=? COLLATE NOCASE", (username.strip(),)).fetchone()
        if not user or user["role"] != "superadmin":
            raise ValueError("Select one of the initial Superadmin accounts")
        now = database.now_iso()
        db.execute("UPDATE users SET password_salt=?,password_hash=?,must_change_password=0,language=?,updated_at=? WHERE id=?",
                   (salt,digest,language,now,user["id"]))
        token, csrf = _create_session(db, int(user["id"]), ip, user_agent)
        user = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
        _audit_db(db, dict(user), "bootstrap_completed", detail="Initial Superadmin configured", ip=ip)
    return _public(user, csrf), token


def login(username: str, password: str, language: str, ip: str = "", user_agent: str = "") -> tuple[dict[str, Any], str]:
    with database.connect() as db:
        db.execute("BEGIN IMMEDIATE")
        user = db.execute("SELECT * FROM users WHERE username=? COLLATE NOCASE", (username.strip(),)).fetchone()
        if not user or not user["active"]:
            raise ValueError("Invalid username or password")
        now = datetime.now().astimezone()
        if user["locked_until"] and datetime.fromisoformat(user["locked_until"]) > now:
            raise ValueError("Account temporarily locked. Try again later")
        valid = False
        if user["password_hash"]:
            _, candidate = _hash_password(password, user["password_salt"])
            valid = hmac.compare_digest(candidate, user["password_hash"])
        if not valid:
            attempts = int(user["failed_attempts"]) + 1
            locked_until = (now + timedelta(minutes=15)).isoformat(timespec="seconds") if attempts >= 5 else None
            db.execute("UPDATE users SET failed_attempts=?,locked_until=? WHERE id=?", (0 if locked_until else attempts, locked_until, user["id"]))
            _audit_db(db, dict(user), "login_failed", detail="Invalid credentials", ip=ip)
            if not user["password_hash"]:
                raise ValueError("This account needs a password reset by a Superadmin")
            raise ValueError("Invalid username or password")
        language = language if language in {"en", "es"} else user["language"]
        db.execute("UPDATE users SET failed_attempts=0,locked_until=NULL,language=?,updated_at=? WHERE id=?", (language,database.now_iso(),user["id"]))
        token, csrf = _create_session(db, int(user["id"]), ip, user_agent)
        user = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
        _audit_db(db, dict(user), "login", detail="Successful login", ip=ip)
    return _public(user, csrf), token


def authenticate(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with database.connect() as db:
        row = db.execute(
            """SELECT u.*,s.csrf_token,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id
            WHERE s.token_hash=? AND u.active=1""", (token_hash,)
        ).fetchone()
        if not row:
            return None
        now = datetime.now().astimezone()
        if datetime.fromisoformat(row["expires_at"]) <= now:
            db.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash,))
            return None
        expires = now + timedelta(hours=SESSION_HOURS)
        db.execute("UPDATE sessions SET last_seen_at=?,expires_at=? WHERE token_hash=?",
                   (now.isoformat(timespec="seconds"),expires.isoformat(timespec="seconds"),token_hash))
    return _public(row, row["csrf_token"])


def logout(token: str | None, user: dict[str, Any] | None, ip: str = "") -> None:
    if token:
        with database.connect() as db:
            db.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(token.encode()).hexdigest(),))
    if user:
        audit(user, "logout", detail="Session ended", ip=ip)


def require_csrf(user: dict[str, Any], supplied: str | None) -> None:
    if not supplied or not hmac.compare_digest(str(supplied), str(user.get("csrf_token", ""))):
        raise PermissionError("Invalid security token")


def _audit_db(db, user: dict[str, Any] | None, action: str, workspace: str = "", entity_type: str = "",
              entity_id: str = "", detail: str = "", ip: str = "") -> None:
    role = str(user.get("role", "")) if user else ""
    db.execute(
        """INSERT INTO audit_log(user_id,user_name,action,workspace,entity_type,entity_id,detail,emergency_admin,ip_address,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?)""",
        (user.get("id") if user else None,user.get("display_name", "System") if user else "System",action,workspace,
         entity_type,str(entity_id),detail[:2000],int(role=="secretadmin"),ip,database.now_iso()),
    )


def audit(user: dict[str, Any] | None, action: str, workspace: str = "", entity_type: str = "",
          entity_id: str = "", detail: str = "", ip: str = "") -> None:
    with database.connect() as db:
        _audit_db(db,user,action,workspace,entity_type,entity_id,detail,ip)


def can_admin(user: dict[str, Any]) -> bool:
    return user.get("role") in ADMIN_ROLES


def is_management_profile(user: dict[str, Any]) -> bool:
    return str(user.get("username") or "").casefold() == "takujiyamada"


def can_team_reports(user: dict[str, Any]) -> bool:
    return user.get("role") in TEAM_REPORT_ROLES


def can_edit_quote(user: dict[str, Any], nt_agent: str) -> bool:
    role = user.get("role")
    if role in ADMIN_ROLES | {"supervisor"}:
        return True
    if role == "readonly":
        return False
    agent = str(user.get("agent_name") or user.get("display_name") or "").casefold()
    quote_agent = str(nt_agent or "").casefold()
    if agent == quote_agent:
        return True
    return bool(agent.split() and quote_agent.split() and agent.split()[0] == quote_agent.split()[0])


def list_users(requester: dict[str, Any]) -> list[dict[str, Any]]:
    if not can_admin(requester):
        raise PermissionError("Administrator permission required")
    with database.connect() as db:
        rows = db.execute("SELECT * FROM users ORDER BY display_name").fetchall()
    return [_public(row) for row in rows]


def create_user(requester: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    if not can_admin(requester): raise PermissionError("Administrator permission required")
    username = str(payload.get("username", "")).strip().replace(" ", "").lower()
    name = str(payload.get("display_name", "")).strip()
    # Access levels are internal system settings. New accounts are always regular users;
    # the Users screen intentionally does not expose role management.
    role = "user"
    password = str(payload.get("password", ""))
    if not username or not name: raise ValueError("Username and display name are required")
    salt,digest=_hash_password(password); now=database.now_iso()
    with database.connect() as db:
        try:
            cursor=db.execute("""INSERT INTO users(username,display_name,role,agent_name,language,password_salt,password_hash,
                must_change_password,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)""",
                (username,name,role,str(payload.get("agent_name") or name),str(payload.get("language") or "en"),salt,digest,1,now,now))
        except Exception as exc:
            if "UNIQUE" in str(exc).upper(): raise ValueError("Username already exists") from exc
            raise
        row=db.execute("SELECT * FROM users WHERE id=?",(cursor.lastrowid,)).fetchone()
        _audit_db(db,requester,"user_created",entity_type="user",entity_id=str(row["id"]),detail=f"{name} / {role}")
    return _public(row)


def update_user(requester: dict[str, Any], user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    if not can_admin(requester): raise PermissionError("Administrator permission required")
    with database.connect() as db:
        db.execute("BEGIN IMMEDIATE")
        current=db.execute("SELECT * FROM users WHERE id=?",(user_id,)).fetchone()
        if not current: raise KeyError("User not found")
        # Preserve the existing internal access level. The administration workflow
        # only edits identity, agent assignment, activation, and temporary password.
        role=str(current["role"]); active=int(bool(payload.get("active",current["active"])))
        if user_id==requester["id"] and not active: raise ValueError("You cannot deactivate your own account")
        name=str(payload.get("display_name",current["display_name"])).strip()
        agent=str(payload.get("agent_name",current["agent_name"])).strip()
        language=str(payload.get("language",current["language"])); language=language if language in {"en","es"} else "en"
        db.execute("UPDATE users SET display_name=?,role=?,agent_name=?,language=?,active=?,updated_at=? WHERE id=?",
                   (name,role,agent,language,active,database.now_iso(),user_id))
        password=str(payload.get("password", ""))
        if password:
            salt,digest=_hash_password(password)
            db.execute("UPDATE users SET password_salt=?,password_hash=?,must_change_password=1,failed_attempts=0,locked_until=NULL WHERE id=?",
                       (salt,digest,user_id))
            db.execute("DELETE FROM sessions WHERE user_id=?",(user_id,))
        row=db.execute("SELECT * FROM users WHERE id=?",(user_id,)).fetchone()
        _audit_db(db,requester,"user_updated",entity_type="user",entity_id=str(user_id),detail=f"{name} / {role}; password_reset={bool(password)}")
    return _public(row)


def update_preferences(user: dict[str, Any], language: str) -> dict[str, Any]:
    if language not in {"en","es"}: raise ValueError("Invalid language")
    with database.connect() as db:
        db.execute("UPDATE users SET language=?,updated_at=? WHERE id=?",(language,database.now_iso(),user["id"]))
        row=db.execute("SELECT * FROM users WHERE id=?",(user["id"],)).fetchone()
    return _public(row,user.get("csrf_token", ""))


def change_password(user: dict[str, Any], current_password: str, new_password: str) -> None:
    with database.connect() as db:
        row=db.execute("SELECT * FROM users WHERE id=?",(user["id"],)).fetchone()
        if not row: raise KeyError("User not found")
        if row["password_hash"]:
            _,candidate=_hash_password(current_password,row["password_salt"])
            if not hmac.compare_digest(candidate,row["password_hash"]): raise ValueError("Current password is incorrect")
        salt,digest=_hash_password(new_password)
        db.execute("UPDATE users SET password_salt=?,password_hash=?,must_change_password=0,updated_at=? WHERE id=?",
                   (salt,digest,database.now_iso(),user["id"]))
        _audit_db(db,user,"password_changed",entity_type="user",entity_id=str(user["id"]),detail="Own password changed")


def recent_audit(requester: dict[str, Any], limit: int = 100) -> list[dict[str, Any]]:
    if requester.get("role") != "secretadmin":
        raise PermissionError("Audit history is restricted to the Secretadmin")
    with database.connect() as db:
        rows=db.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?",(max(1,min(limit,500)),)).fetchall()
    return database.rows_to_dicts(rows)
