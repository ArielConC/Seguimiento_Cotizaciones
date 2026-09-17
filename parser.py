from __future__ import annotations

import calendar
import re
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


MONTHS = {
    "ene": 1,
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "abr": 4,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "ago": 8,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dic": 12,
    "dec": 12,
}


@dataclass(frozen=True)
class QuoteData:
    folio: str
    quote_date: date
    receptor: str
    distributor_agent: str
    nt_agent: str
    customer_order: str
    total_usd: Decimal
    currency: str
    source_path: str


def _capture(text: str, pattern: str, default: str = "") -> str:
    match = re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
    return " ".join(match.group(1).split()).strip() if match else default


def _parse_date(raw: str) -> date:
    match = re.search(r"(\d{1,2})/([A-Za-z]{3})/(\d{4})", raw)
    if not match:
        raise ValueError(f"Unrecognized quotation date: {raw!r}")
    day, month_name, year = match.groups()
    month = MONTHS.get(month_name.lower())
    if not month:
        raise ValueError(f"Unrecognized quotation month: {month_name!r}")
    return date(int(year), month, int(day))


def priority_for_total(total: Decimal) -> str:
    if total <= Decimal("500"):
        return "C"
    if total <= Decimal("1000"):
        return "B"
    if total <= Decimal("5000"):
        return "A"
    return "S"


def subtract_months(value: date, months: int) -> date:
    absolute = value.year * 12 + value.month - 1 - months
    year, month_index = divmod(absolute, 12)
    month = month_index + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def month_folder_names(start: date, end: date) -> list[str]:
    current = date(start.year, start.month, 1)
    last = date(end.year, end.month, 1)
    result: list[str] = []
    while current <= last:
        result.append(current.strftime("%Y-%m"))
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)
    return result


def candidate_pdfs(root: Path, months_back: int, today: date | None = None) -> list[Path]:
    today = today or date.today()
    cutoff = subtract_months(today, months_back)
    files: list[Path] = []
    for folder_name in month_folder_names(cutoff, today):
        folder = root / folder_name
        if folder.is_dir():
            files.extend(folder.glob("*.pdf"))
            files.extend(folder.glob("*.PDF"))
    return sorted(set(files))


def parse_quote(pdf_path: Path) -> QuoteData:
    try:
        reader = PdfReader(str(pdf_path))
        if not reader.pages:
            raise ValueError("The PDF does not contain any pages")
        text = reader.pages[0].extract_text(extraction_mode="layout") or ""
        if len(reader.pages) > 1 and not re.search(r"\bTOTAL\s+\$", text, re.IGNORECASE):
            text += "\n" + (reader.pages[-1].extract_text(extraction_mode="layout") or "")
    except Exception:
        text = ""

    # pdfplumber is slower but recovers files whose internal PDF structure
    # cannot be interpreted correctly by the fast reader.
    if not text.strip():
        with pdfplumber.open(pdf_path) as document:
            if not document.pages:
                raise ValueError("The PDF does not contain any pages")
            text = document.pages[0].extract_text(x_tolerance=2, y_tolerance=2) or ""
            if len(document.pages) > 1 and not re.search(r"\bTOTAL\s+\$", text, re.IGNORECASE):
                text += "\n" + (document.pages[-1].extract_text(x_tolerance=2, y_tolerance=2) or "")

    raw_folio = _capture(text, r"Serie\s+y\s+Folio\s+((?:QTI|QT)\s*-\s*\d+)")
    raw_date = _capture(text, r"Fecha\s+y\s+Hora\s+([^\n]+)")
    receptor = _capture(text, r"^\s*Receptor:\s*([^\n]+)")
    customer_order = _capture(text, r"Orden\s+del\s+Cliente:\s*(.*?)\s+Calle:")
    distributor = _capture(text, r"Agente\s+Distribuidor:\s*(.*?)\s+Numero:")
    nt_agent = _capture(text, r"Agente\s+NT\s+TOOL\s*(.*?)\s+Colonia:")
    raw_total = _capture(text, r"\bTOTAL\s+\$\s*([\d,]+(?:\.\d{2})?)")

    missing = [
        name
        for name, value in (
            ("folio", raw_folio),
            ("fecha", raw_date),
            ("receptor", receptor),
            ("total", raw_total),
        )
        if not value
    ]
    if missing:
        raise ValueError("The following fields were not found: " + ", ".join(missing))

    currency = "MXN" if re.search(r"\bPesos\b|\bMXN\b", text, re.IGNORECASE) else "USD"
    return QuoteData(
        folio=re.sub(r"\s+", "", raw_folio.upper()),
        quote_date=_parse_date(raw_date),
        receptor=receptor,
        distributor_agent=distributor,
        nt_agent=nt_agent,
        customer_order=customer_order,
        total_usd=Decimal(raw_total.replace(",", "")),
        currency=currency,
        source_path=str(pdf_path.resolve()),
    )
