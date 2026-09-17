from __future__ import annotations

import sys
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_DIR = PROJECT_DIR.parent
sys.path.insert(0, str(PROJECT_DIR))

from parser import candidate_pdfs, month_folder_names, parse_quote, priority_for_total, subtract_months


class PriorityTests(unittest.TestCase):
    def test_priority_boundaries(self) -> None:
        cases = {
            Decimal("0"): "C",
            Decimal("100"): "C",
            Decimal("500"): "C",
            Decimal("500.01"): "B",
            Decimal("1000"): "B",
            Decimal("1000.01"): "A",
            Decimal("5000"): "A",
            Decimal("5000.01"): "S",
        }
        for amount, expected in cases.items():
            with self.subTest(amount=amount):
                self.assertEqual(priority_for_total(amount), expected)

    def test_three_month_cutoff(self) -> None:
        self.assertEqual(subtract_months(date(2026, 9, 14), 3), date(2026, 6, 14))
        self.assertEqual(
            month_folder_names(date(2026, 6, 14), date(2026, 9, 14)),
            ["2026-06", "2026-07", "2026-08", "2026-09"],
        )


class PdfParserTests(unittest.TestCase):
    def test_example_quote(self) -> None:
        sample = WORKSPACE_DIR / "QT_12048.pdf"
        if not sample.exists():
            self.skipTest("El PDF de ejemplo no está disponible")
        quote = parse_quote(sample)
        self.assertEqual(quote.folio, "QT-12048")
        self.assertEqual(quote.quote_date, date(2026, 9, 14))
        self.assertEqual(quote.receptor, "SUMITOMO ELECTRIC HARDMETAL DE MEXICO")
        self.assertEqual(quote.distributor_agent, "AKIKO KUDO")
        self.assertEqual(quote.nt_agent, "ARIEL CONTRERAS")
        self.assertEqual(quote.customer_order, "")
        self.assertEqual(quote.total_usd, Decimal("112.76"))
        self.assertEqual(priority_for_total(quote.total_usd), "C")

    def test_international_quote(self) -> None:
        sample = Path(r"C:\Users\fcoar\Dropbox\Quotation\2026-06\QTI_486 (HYT).pdf")
        if not sample.exists():
            self.skipTest("La cotización internacional no está disponible")
        quote = parse_quote(sample)
        self.assertEqual(quote.folio, "QTI-486")
        self.assertEqual(quote.quote_date, date(2026, 6, 17))
        self.assertEqual(quote.total_usd, Decimal("4219.95"))
        self.assertEqual(priority_for_total(quote.total_usd), "A")


if __name__ == "__main__":
    unittest.main()
