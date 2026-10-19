from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path

import restore_postgres_export


class PostgresExportTests(unittest.TestCase):
    def _write_export(self, path: Path, tables: dict[str, list[dict]]) -> None:
        manifest = {
            "format": restore_postgres_export.EXPECTED_FORMAT,
            "created_at": "2026-10-19T12:00:00-06:00",
            "tables": {name: len(rows) for name, rows in tables.items()},
        }
        with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("manifest.json", json.dumps(manifest))
            for name, rows in tables.items():
                content = "".join(json.dumps(row) + "\n" for row in rows)
                archive.writestr(f"tables/{name}.jsonl", content)

    def test_logical_export_can_be_validated_without_a_database(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "backup.zip"
            self._write_export(path, {"settings": [{"key": "months_back", "value": "3"}], "quotes": []})
            manifest, tables = restore_postgres_export.read_export(path)
            self.assertEqual(manifest["format"], restore_postgres_export.EXPECTED_FORMAT)
            self.assertEqual(tables["settings"][0]["value"], "3")
            self.assertEqual(tables["quotes"], [])

    def test_logical_export_rejects_unknown_tables(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "backup.zip"
            self._write_export(path, {"unexpected_table": []})
            with self.assertRaisesRegex(RuntimeError, "unsupported tables"):
                restore_postgres_export.read_export(path)


if __name__ == "__main__":
    unittest.main()
