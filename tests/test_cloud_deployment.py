from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]


class CloudDeploymentTests(unittest.TestCase):
    def _run(self, code: str, changes: dict[str, str | None]) -> subprocess.CompletedProcess[str]:
        environment = os.environ.copy()
        for key, value in changes.items():
            if value is None:
                environment.pop(key, None)
            else:
                environment[key] = value
        return subprocess.run(
            [sys.executable, "-c", code],
            cwd=PROJECT_DIR,
            env=environment,
            text=True,
            capture_output=True,
            timeout=20,
            check=False,
        )

    def test_railway_uses_dynamic_port_volume_and_secure_proxy_defaults(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            result = self._run(
                "import json,app,database; print(json.dumps({'port':app.PORT,'data':str(database.DATA_DIR),"
                "'secure':app.COOKIE_SECURE,'proxy':app.TRUST_PROXY}))",
                {
                    "PORT": "54321",
                    "RAILWAY_ENVIRONMENT_ID": "production-test",
                    "RAILWAY_VOLUME_MOUNT_PATH": folder,
                    "NT_QUOTE_DATA_DIR": None,
                    "NT_QUOTE_COOKIE_SECURE": None,
                    "NT_QUOTE_TRUST_PROXY": None,
                },
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            values = json.loads(result.stdout.strip())
            self.assertEqual(values["port"], 54321)
            self.assertEqual(Path(values["data"]), Path(folder))
            self.assertTrue(values["secure"])
            self.assertTrue(values["proxy"])

    def test_railway_refuses_ephemeral_database(self) -> None:
        result = self._run(
            "import database",
            {
                "RAILWAY_ENVIRONMENT_ID": "production-test",
                "RAILWAY_VOLUME_MOUNT_PATH": None,
                "NT_QUOTE_DATA_DIR": None,
            },
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Persistent storage is required on Railway", result.stderr)


if __name__ == "__main__":
    unittest.main()
