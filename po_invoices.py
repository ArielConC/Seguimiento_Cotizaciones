from __future__ import annotations

from datetime import date
from typing import Any


INVOICE_TABLES = {"quote_invoices", "special_quote_invoices"}


def _table(name: str) -> str:
    if name not in INVOICE_TABLES:
        raise ValueError("Invalid invoice table")
    return name


def normalize(
    raw_invoices: Any,
    currency: str,
    *,
    legacy_total: Any = None,
    legacy_date: Any = None,
    legacy_number: str = "",
) -> list[dict[str, Any]]:
    """Validate a complete PO invoice list, with compatibility for old clients."""
    if raw_invoices is None and legacy_total not in (None, ""):
        raw_invoices = [{
            "invoice_date": legacy_date,
            "invoice_series": "LEGACY",
            "invoice_number": legacy_number or "HISTORICAL-PO",
            "amount": legacy_total,
        }]
    if not isinstance(raw_invoices, list) or not raw_invoices:
        raise ValueError("Add at least one invoice before changing the status to PO")
    if len(raw_invoices) > 100:
        raise ValueError("A PO cannot contain more than 100 invoices")
    normalized: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for index, raw in enumerate(raw_invoices, start=1):
        if not isinstance(raw, dict):
            raise ValueError(f"Invoice {index} is invalid")
        invoice_date = str(raw.get("invoice_date") or raw.get("date") or "").strip()
        invoice_series = str(raw.get("invoice_series") or raw.get("series") or raw.get("folio") or "").strip()
        invoice_number = str(raw.get("invoice_number") or raw.get("number") or raw.get("code") or "").strip()
        if not invoice_date:
            raise ValueError(f"Invoice {index}: select the invoice date")
        try:
            date.fromisoformat(invoice_date)
        except ValueError as exc:
            raise ValueError(f"Invoice {index}: invalid invoice date") from exc
        if not invoice_series:
            raise ValueError(f"Invoice {index}: enter the invoice series/folio")
        if not invoice_number:
            raise ValueError(f"Invoice {index}: enter the invoice number/code")
        if len(invoice_series) > 40 or len(invoice_number) > 100:
            raise ValueError(f"Invoice {index}: series or number is too long")
        try:
            amount = float(str(raw.get("amount", "")).replace(",", "").replace("$", "").replace("¥", "").strip())
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invoice {index}: amount must be numeric") from exc
        if amount <= 0:
            raise ValueError(f"Invoice {index}: amount must be greater than zero")
        key = (invoice_series.casefold(), invoice_number.casefold())
        if key in seen:
            raise ValueError(f"Invoice {index}: the same series and invoice number is repeated")
        seen.add(key)
        normalized.append({
            "invoice_date": invoice_date,
            "invoice_series": invoice_series,
            "invoice_number": invoice_number,
            "amount": amount,
            "currency": currency,
        })
    return normalized


def signature(invoices: list[dict[str, Any]]) -> tuple[tuple[Any, ...], ...]:
    return tuple(sorted((
        str(row.get("invoice_date") or ""),
        str(row.get("invoice_series") or "").strip().casefold(),
        str(row.get("invoice_number") or "").strip().casefold(),
        round(float(row.get("amount") or 0), 4),
        str(row.get("currency") or ""),
    ) for row in invoices))


def totals(invoices: list[dict[str, Any]]) -> tuple[float, str]:
    return sum(float(row["amount"]) for row in invoices), max(str(row["invoice_date"]) for row in invoices)


def active(db: Any, table: str, quote_id: int) -> list[dict[str, Any]]:
    table = _table(table)
    rows = db.execute(
        f"""SELECT id,invoice_date,invoice_series,invoice_number,amount,currency,created_by_user_id,
        created_by_name,created_at,is_legacy FROM {table} WHERE quote_id=? AND active=1
        ORDER BY invoice_date,id""",
        (quote_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def replace(
    db: Any,
    table: str,
    quote_id: int,
    invoices: list[dict[str, Any]],
    actor_id: int | None,
    actor_name: str,
    timestamp: str,
) -> bool:
    table = _table(table)
    current = active(db, table, quote_id)
    if signature(current) == signature(invoices):
        return False
    db.execute(f"UPDATE {table} SET active=0,superseded_at=? WHERE quote_id=? AND active=1", (timestamp, quote_id))
    db.executemany(
        f"""INSERT INTO {table}(quote_id,invoice_date,invoice_series,invoice_number,amount,currency,
        created_by_user_id,created_by_name,created_at,active,is_legacy)
        VALUES(?,?,?,?,?,?,?,?,?,1,0)""",
        [(quote_id,row["invoice_date"],row["invoice_series"],row["invoice_number"],row["amount"],row["currency"],
          actor_id,actor_name,timestamp) for row in invoices],
    )
    return True


def clear(db: Any, table: str, quote_id: int, timestamp: str) -> bool:
    table = _table(table)
    result = db.execute(f"UPDATE {table} SET active=0,superseded_at=? WHERE quote_id=? AND active=1", (timestamp, quote_id))
    return bool(result.rowcount)


def migrate_legacy(
    db: Any,
    quote_table: str,
    invoice_table: str,
    event_table: str,
    currency: str,
) -> int:
    if quote_table not in {"quotes", "special_quotes"} or event_table not in {"quote_events", "special_quote_events"}:
        raise ValueError("Invalid legacy migration table")
    invoice_table = _table(invoice_table)
    rows = db.execute(
        f"""SELECT q.id,q.po_date,q.po_total_usd,q.updated_at FROM {quote_table} q
        WHERE q.status='po' AND q.po_date IS NOT NULL AND COALESCE(q.po_total_usd,0)>0
        AND NOT EXISTS(SELECT 1 FROM {invoice_table} i WHERE i.quote_id=q.id AND i.active=1)"""
    ).fetchall()
    for row in rows:
        created_at = row["updated_at"] or row["po_date"]
        db.execute(
            f"""INSERT INTO {invoice_table}(quote_id,invoice_date,invoice_series,invoice_number,amount,currency,
            created_by_name,created_at,active,is_legacy) VALUES(?,?,?,?,?,?,'Historical data',?,1,1)""",
            (row["id"],row["po_date"],"LEGACY",f"PO-{row['id']}",row["po_total_usd"],currency,created_at),
        )
        db.execute(
            f"""INSERT INTO {event_table}(quote_id,event_type,note,user_name,created_at)
            VALUES(?,'po_invoices_migrated','Historical PO converted to one legacy invoice','System',?)""",
            (row["id"],created_at),
        )
    return len(rows)


def automatic_comment(invoices: list[dict[str, Any]], currency: str, language: str, updated: bool = False) -> str:
    total, po_date = totals(invoices)
    count = len(invoices)
    money = f"JPY {total:,.0f}" if currency == "JPY" else f"USD {total:,.2f}"
    if language == "es":
        verb = "Se actualizó" if updated else "Se registró"
        noun = "factura" if count == 1 else "facturas"
        return f"{verb} PO con {count} {noun} por un total de {money}. Fecha de PO: {po_date}."
    verb = "updated" if updated else "registered"
    noun = "invoice" if count == 1 else "invoices"
    return f"PO {verb} with {count} {noun} for a total of {money}. PO date: {po_date}."
