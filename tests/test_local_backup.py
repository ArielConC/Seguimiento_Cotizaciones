from __future__ import annotations

import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import backup_neon_local as local_backup


def touch(folder: Path, name: str, age_hours: float) -> Path:
    path = folder / name
    path.write_bytes(b"x")
    stamp = time.time() - age_hours * 3600
    os.utime(path, (stamp, stamp))
    return path


class LocalBackupTests(unittest.TestCase):
    def test_retention_keeps_newest_and_removes_checksums(self):
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            for index in range(5):
                zip_path = touch(folder, f"{local_backup.PREFIX}{index}.zip", age_hours=index)
                Path(str(zip_path) + ".sha256").write_text("x")
            removed = local_backup.retain(folder, 2)
            self.assertEqual(len(removed), 3)
            self.assertEqual(sorted(p.name for p in folder.glob("*.zip")),
                             [f"{local_backup.PREFIX}0.zip", f"{local_backup.PREFIX}1.zip"])
            self.assertEqual(len(list(folder.glob("*.sha256"))), 2)

    def test_recent_backup_is_detected(self):
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            touch(folder, f"{local_backup.PREFIX}a.zip", age_hours=3)
            self.assertIsNotNone(local_backup.is_recent(folder, 20))
            self.assertIsNone(local_backup.is_recent(folder, 2))
            self.assertIsNone(local_backup.is_recent(folder, 0))

    def test_requires_database_url(self):
        with tempfile.TemporaryDirectory() as raw, mock.patch.dict(os.environ, {"DATABASE_URL": ""}):
            self.assertEqual(local_backup.run(Path(raw), 60, 0), 2)

    def test_skips_when_recent_backup_exists(self):
        with tempfile.TemporaryDirectory() as raw, mock.patch.dict(os.environ, {"DATABASE_URL": "postgresql://x/y"}):
            folder = Path(raw)
            touch(folder, f"{local_backup.PREFIX}a.zip", age_hours=1)
            self.assertEqual(local_backup.run(folder, 60, 20), 0)
            self.assertEqual(len(list(folder.glob("*.zip"))), 1)


if __name__ == "__main__":
    unittest.main()
