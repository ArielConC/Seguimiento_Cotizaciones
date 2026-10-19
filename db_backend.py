from __future__ import annotations

import os
import re
import sqlite3
from collections.abc import Iterator, Mapping, Sequence
from pathlib import Path
from typing import Any


IDENTITY_TABLES = {
    "audit_log",
    "backup_runs",
    "daily_notes",
    "imports",
    "po_invoices",
    "quote_comments",
    "quote_events",
    "quote_invoices",
    "quotes",
    "scan_runs",
    "special_imports",
    "special_daily_notes",
    "special_quote_comments",
    "special_quote_events",
    "special_quote_invoices",
    "special_quotes",
    "users",
}


def database_url() -> str:
    return os.environ.get("DATABASE_URL", "").strip()


def backend_name() -> str:
    return "postgresql" if database_url() else "sqlite"


def is_postgres() -> bool:
    return backend_name() == "postgresql"


class ClosingSQLiteConnection(sqlite3.Connection):
    def __exit__(self, exc_type, exc_value, traceback) -> bool:
        try:
            return super().__exit__(exc_type, exc_value, traceback)
        finally:
            self.close()


def sqlite_connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=30, factory=ClosingSQLiteConnection)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA busy_timeout = 30000")
    return connection


class HybridRow(Mapping[str, Any]):
    """Mapping compatible with sqlite3.Row that also accepts integer indexes."""

    def __init__(self, columns: Sequence[str], values: Sequence[Any]):
        self._columns = tuple(columns)
        self._values = tuple(values)
        self._positions = {name: index for index, name in enumerate(self._columns)}

    def __getitem__(self, key: str | int) -> Any:
        if isinstance(key, int):
            return self._values[key]
        return self._values[self._positions[key]]

    def __iter__(self) -> Iterator[str]:
        return iter(self._columns)

    def __len__(self) -> int:
        return len(self._columns)

    def keys(self):
        return self._columns


def _replace_qmarks(sql: str) -> str:
    """Convert SQLite ``?`` markers to psycopg ``%s`` markers.

    psycopg treats every ``%`` as the start of a placeholder, so literal percent
    signs (for example ``LIKE 'Merged duplicate%'``) must be doubled.
    """
    output: list[str] = []
    quote = ""
    index = 0
    while index < len(sql):
        char = sql[index]
        if quote:
            output.append("%%" if char == "%" else char)
            if char == quote:
                if index + 1 < len(sql) and sql[index + 1] == quote:
                    output.append(sql[index + 1])
                    index += 1
                else:
                    quote = ""
        elif char in {"'", '"'}:
            quote = char
            output.append(char)
        elif char == "?":
            output.append("%s")
        elif char == "%":
            output.append("%%")
        else:
            output.append(char)
        index += 1
    return "".join(output)


def _identity_insert_table(sql: str) -> str:
    match = re.match(r"\s*INSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)", sql, flags=re.IGNORECASE)
    if not match:
        return ""
    table = match.group(1).lower()
    return table if table in IDENTITY_TABLES else ""


def _append_on_conflict(sql: str) -> str:
    suffix = ";" if sql.rstrip().endswith(";") else ""
    body = sql.rstrip().removesuffix(";").rstrip()
    return f"{body} ON CONFLICT DO NOTHING{suffix}"


def _remove_function_wrapper(sql: str, function_name: str) -> str:
    pattern = re.compile(rf"\b{re.escape(function_name)}\s*\(", flags=re.IGNORECASE)
    position = 0
    while True:
        match = pattern.search(sql, position)
        if not match:
            return sql
        opening = match.end() - 1
        depth = 0
        quote = ""
        closing = -1
        index = opening
        while index < len(sql):
            char = sql[index]
            if quote:
                if char == quote:
                    if index + 1 < len(sql) and sql[index + 1] == quote:
                        index += 1
                    else:
                        quote = ""
            elif char in {"'", '"'}:
                quote = char
            elif char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    closing = index
                    break
            index += 1
        if closing < 0:
            return sql
        inner = sql[opening + 1 : closing]
        sql = sql[: match.start()] + f"({inner})" + sql[closing + 1 :]
        position = match.start() + len(inner) + 2


def translate_sql(sql: str) -> str:
    """Translate the small SQLite dialect used by this project to PostgreSQL."""
    translated = sql
    ignore = bool(re.search(r"\bINSERT\s+OR\s+IGNORE\s+INTO\b", translated, flags=re.IGNORECASE))
    translated = re.sub(
        r"\bINSERT\s+OR\s+IGNORE\s+INTO\b", "INSERT INTO", translated, flags=re.IGNORECASE
    )
    translated = re.sub(
        r"INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT",
        "BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY",
        translated,
        flags=re.IGNORECASE,
    )
    # SQLite REAL is an 8-byte floating-point value, while PostgreSQL REAL is
    # only 4 bytes. Keep the original precision for quotation and PO amounts.
    translated = re.sub(r"\bREAL\b", "DOUBLE PRECISION", translated, flags=re.IGNORECASE)
    translated = re.sub(
        r"([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(%s|\?)\s+COLLATE\s+NOCASE\b",
        r"LOWER(\1)=LOWER(\2)",
        translated,
        flags=re.IGNORECASE,
    )
    translated = re.sub(r"\s+COLLATE\s+NOCASE\b", "", translated, flags=re.IGNORECASE)
    translated = re.sub(
        r"\bBEGIN\s+IMMEDIATE\b",
        "SELECT pg_advisory_xact_lock(68421573)",
        translated,
        flags=re.IGNORECASE,
    )
    translated = re.sub(r"\binstr\(([^,()]+),\s*([^()]+)\)", r"strpos(\1,\2)", translated, flags=re.IGNORECASE)
    translated = _remove_function_wrapper(translated, "datetime")
    translated = re.sub(
        r"\bdate\(\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\)",
        r"substr(\1,1,10)",
        translated,
        flags=re.IGNORECASE,
    )
    translated = re.sub(
        r"printf\(\s*'SPQ-%05d'\s*,\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\)",
        r"('SPQ-' || LPAD((\1)::text,5,'0'))",
        translated,
        flags=re.IGNORECASE,
    )
    translated = re.sub(
        r"SUM\(\s*([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*('[^']*')\s*\)",
        r"SUM(CASE WHEN \1=\2 THEN 1 ELSE 0 END)",
        translated,
        flags=re.IGNORECASE,
    )
    # SQLite LIKE ignores ASCII case; PostgreSQL LIKE does not. Keep searches
    # (quotation, customer, End User, distributor) case-insensitive.
    translated = re.sub(r"\bLIKE\b", "ILIKE", translated, flags=re.IGNORECASE)
    translated = re.sub(
        r"ALTER\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)",
        r"ALTER TABLE \1 ADD COLUMN IF NOT EXISTS ",
        translated,
        flags=re.IGNORECASE,
    )
    if ignore and "ON CONFLICT" not in translated.upper():
        translated = _append_on_conflict(translated)
    return _replace_qmarks(translated).strip()


def split_script(script: str) -> list[str]:
    statements: list[str] = []
    current: list[str] = []
    quote = ""
    index = 0
    while index < len(script):
        char = script[index]
        if quote:
            current.append(char)
            if char == quote:
                if index + 1 < len(script) and script[index + 1] == quote:
                    current.append(script[index + 1])
                    index += 1
                else:
                    quote = ""
        elif char in {"'", '"'}:
            quote = char
            current.append(char)
        elif char == ";":
            statement = "".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
        else:
            current.append(char)
        index += 1
    statement = "".join(current).strip()
    if statement:
        statements.append(statement)
    return statements


class PostgresCursor:
    def __init__(self, connection: "PostgresConnection"):
        self.connection = connection
        self._cursor = connection._connection.cursor()
        self.lastrowid: int | None = None
        self._buffer: list[HybridRow] = []

    @property
    def rowcount(self) -> int:
        return self._cursor.rowcount

    def _columns(self) -> tuple[str, ...]:
        return tuple(column.name for column in (self._cursor.description or ()))

    def _row(self, values: Sequence[Any] | None) -> HybridRow | None:
        return HybridRow(self._columns(), values) if values is not None else None

    def execute(self, sql: str, parameters: Sequence[Any] | None = None) -> "PostgresCursor":
        translated = translate_sql(sql)
        if not translated:
            return self
        table = _identity_insert_table(translated)
        if table and "RETURNING" not in translated.upper():
            translated = translated.rstrip().removesuffix(";").rstrip() + " RETURNING id"
        self._cursor.execute(translated, tuple(parameters or ()))
        if table and self._cursor.description:
            rows = self._cursor.fetchall()
            if rows:
                self.lastrowid = int(rows[-1][0])
        return self

    def executemany(self, sql: str, parameter_rows: Sequence[Sequence[Any]]) -> "PostgresCursor":
        self._cursor.executemany(translate_sql(sql), parameter_rows)
        return self

    def fetchone(self) -> HybridRow | None:
        if self._buffer:
            return self._buffer.pop(0)
        return self._row(self._cursor.fetchone())

    def fetchall(self) -> list[HybridRow]:
        rows = self._buffer + [self._row(row) for row in self._cursor.fetchall()]
        self._buffer = []
        return [row for row in rows if row is not None]

    def close(self) -> None:
        self._cursor.close()


class PostgresConnection:
    backend = "postgresql"

    def __init__(self, url: str):
        try:
            import psycopg
        except ImportError as exc:
            raise RuntimeError("PostgreSQL support requires psycopg[binary]") from exc
        # connect_timeout leaves room for Neon to wake a suspended compute.
        self._connection = psycopg.connect(
            url,
            autocommit=False,
            prepare_threshold=None,
            application_name="quotation-follow-up",
            connect_timeout=30,
        )

    def execute(self, sql: str, parameters: Sequence[Any] | None = None) -> PostgresCursor:
        return PostgresCursor(self).execute(sql, parameters)

    def executemany(self, sql: str, parameter_rows: Sequence[Sequence[Any]]) -> PostgresCursor:
        return PostgresCursor(self).executemany(sql, parameter_rows)

    def executescript(self, script: str) -> None:
        for statement in split_script(script):
            self.execute(statement)

    def commit(self) -> None:
        self._connection.commit()

    def rollback(self) -> None:
        self._connection.rollback()

    def close(self) -> None:
        self._connection.close()

    def __enter__(self) -> "PostgresConnection":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> bool:
        try:
            if exc_type is None:
                self.commit()
            else:
                self.rollback()
        finally:
            self.close()
        return False


def connect(path: Path):
    url = database_url()
    return PostgresConnection(url) if url else sqlite_connect(path)
