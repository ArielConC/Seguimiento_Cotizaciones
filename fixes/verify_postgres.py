from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from typing import Any


EXPECTED_COUNTS = {
    "quotes": 518,
    "special_quotes": 192,
    "users": 4,
    "quote_events": 1362,
    "special_quote_events": 295,
}


def concurrent_count(_: int) -> int:
    import database

    with database.connect() as connection:
        return int(connection.execute("SELECT COUNT(*) AS value FROM quotes").fetchone()["value"])


def verify() -> dict[str, Any]:
    import auth
    import backup
    import database
    import db_backend
    import invoice_manager
    import special

    if not db_backend.is_postgres():
        raise RuntimeError("DATABASE_URL is not configured for PostgreSQL")

    # Run startup twice to prove that a Render restart is schema-idempotent.
    for _ in range(2):
        database.initialize()
        special.initialize()
        auth.initialize()
        invoice_manager.initialize()
        backup.initialize()

    with database.connect() as connection:
        counts = {
            table: int(connection.execute(f"SELECT COUNT(*) AS value FROM {table}").fetchone()["value"])
            for table in EXPECTED_COUNTS
        }
    mismatches = {
        table: {"expected": expected, "actual": counts[table]}
        for table, expected in EXPECTED_COUNTS.items()
        if counts[table] != expected
    }
    if mismatches:
        raise RuntimeError("Migrated count mismatch: " + json.dumps(mismatches, sort_keys=True))

    standard_dashboard = database.dashboard()
    special_dashboard = special.dashboard()
    # Exercise every sort order and a case-insensitive search against PostgreSQL.
    for order in ("priority", "date_desc", "date_asc", "folio_desc", "folio_asc", "amount_desc", "amount_asc"):
        database.list_quotes({"order": order})
        special.list_quotes({"order": order})
    searched = database.list_quotes({"search": "sumitomo"})
    standard_rows = database.list_quotes({"order": "newest_activity"})
    managed_rows = database.list_managed_quotes({"status_group": "all"})
    management_rows = database.list_management_quotes({"sort": "folio_desc"})
    special_rows = special.list_quotes({"order": "date_desc"})
    standard_months = database.monthly_report(12)
    special_months = special.monthly_report(12)
    standard_activity = database.report_activity("2020-01-01", "2030-12-31")
    special_activity = special.report_activity("2020-01-01", "2030-12-31")

    known: dict[str, Any] = {}
    with database.connect() as connection:
        for folio in ("QT-11966", "QT-12004", "QT-12089"):
            row = connection.execute(
                "SELECT folio,status,customer_order,po_date,po_total_usd FROM quotes WHERE folio=?",
                (folio,),
            ).fetchone()
            known[folio] = dict(row) if row else None

    with ThreadPoolExecutor(max_workers=4) as executor:
        concurrent_reads = list(executor.map(concurrent_count, range(8)))
    if concurrent_reads != [EXPECTED_COUNTS["quotes"]] * 8:
        raise RuntimeError(f"Concurrent read mismatch: {concurrent_reads}")

    return {
        "ok": True,
        "backend": db_backend.backend_name(),
        "verified_on": date.today().isoformat(),
        "counts": counts,
        "known_records": known,
        "queries": {
            "standard_dashboard_total": standard_dashboard.get("counts", {}).get("total"),
            "special_dashboard_total": special_dashboard.get("counts", {}).get("total"),
            "standard_list_rows": len(standard_rows),
            "case_insensitive_search_rows": len(searched),
            "backup_status": backup.status().get("status"),
            "managed_list_rows": len(managed_rows),
            "management_list_rows": len(management_rows),
            "special_list_rows": len(special_rows),
            "standard_month_buckets": len(standard_months),
            "special_month_buckets": len(special_months),
            "standard_activity_events": len(standard_activity.get("events", [])),
            "special_activity_events": len(special_activity.get("events", [])),
            "bootstrap_needed": auth.bootstrap_needed(),
            "concurrent_reads": len(concurrent_reads),
        },
    }


def main() -> int:
    print(json.dumps(verify(), ensure_ascii=False, indent=2, default=str))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"PostgreSQL verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
