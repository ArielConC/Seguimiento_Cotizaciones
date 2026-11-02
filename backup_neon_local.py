"""Descarga un respaldo logico de la base de datos de Neon a una carpeta local.

Pensado para ejecutarse en la PC del usuario (Programador de tareas de Windows).
Usa la misma exportacion que el boton "Backup now" de la app, asi que el ZIP
resultante se puede restaurar con restore_postgres_export.py.

Variables de entorno:
    DATABASE_URL   Cadena de conexion de Neon (obligatoria).

Solo LEE la base de datos; no escribe nada en Neon.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

PREFIX = "cotizaciones_neon_"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def list_backups(folder: Path) -> list[Path]:
    return sorted(folder.glob(f"{PREFIX}*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)


def is_recent(folder: Path, min_hours: float, now: datetime | None = None) -> Path | None:
    """Return the newest backup if it is younger than ``min_hours``."""
    if min_hours <= 0:
        return None
    files = list_backups(folder)
    if not files:
        return None
    current = (now or datetime.now()).timestamp()
    return files[0] if current - files[0].stat().st_mtime < min_hours * 3600 else None


def retain(folder: Path, keep: int) -> list[Path]:
    removed: list[Path] = []
    for old in list_backups(folder)[max(keep, 1):]:
        old.unlink(missing_ok=True)
        Path(str(old) + ".sha256").unlink(missing_ok=True)
        removed.append(old)
    return removed


def run(destination: Path, keep: int, min_hours: float) -> int:
    if not os.environ.get("DATABASE_URL", "").strip():
        print("ERROR: falta la variable DATABASE_URL", file=sys.stderr)
        return 2
    os.environ.setdefault("NT_QUOTE_TEMP_DIR", str(Path(tempfile.gettempdir()) / "quotation-follow-up"))
    destination.mkdir(parents=True, exist_ok=True)

    recent = is_recent(destination, min_hours)
    if recent:
        print(f"OMITIDO: ya existe un respaldo reciente ({recent.name}).")
        return 0

    import backup  # noqa: E402  (se importa tras fijar el entorno)
    import restore_postgres_export as restore  # noqa: E402

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    final = destination / f"{PREFIX}{stamp}.zip"
    partial = destination / f"{PREFIX}{stamp}.zip.partial"
    try:
        if not backup._postgres_export(partial):
            raise RuntimeError("La verificacion del ZIP fallo")
        manifest, tables = restore.read_export(partial)  # valida formato y conteos por tabla
        partial.replace(final)
    except Exception as exc:
        partial.unlink(missing_ok=True)
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    digest = sha256(final)
    Path(str(final) + ".sha256").write_text(f"{digest}  {final.name}\n", encoding="utf-8")
    removed = retain(destination, keep)
    total = sum(len(rows) for rows in tables.values())
    size_kb = final.stat().st_size / 1024
    print(f"OK: {final} | {len(tables)} tablas | {total} filas | {size_kb:.0f} KB | sha256={digest[:12]}...")
    if removed:
        print(f"Se eliminaron {len(removed)} respaldos antiguos (se conservan {keep}).")
    return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Respaldo logico de Neon a una carpeta local")
    parser.add_argument("--destino", type=Path, required=True, help="Carpeta donde guardar los ZIP")
    parser.add_argument("--mantener", type=int, default=60, help="Cantidad de respaldos a conservar (60)")
    parser.add_argument(
        "--min-horas",
        type=float,
        default=0,
        help="Omitir si ya hay un respaldo con menos de estas horas (0 = siempre respaldar)",
    )
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    return run(args.destino, args.mantener, args.min_horas)


if __name__ == "__main__":
    raise SystemExit(main())
