from __future__ import annotations

import base64
import json
import os
import re
import sqlite3
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import database
import db_backend

APP_DIR = Path(__file__).resolve().parent
LOCAL_TZ = ZoneInfo(os.environ.get("NT_QUOTE_TIME_ZONE", "America/Mexico_City"))
LEGACY_DB_PATH = Path(r"C:\Users\fcoar\Documents\Gemini\Proyectos\Directorio_NT\DirectorioNT\directorio.db")


def _now_iso() -> str:
    return datetime.now(LOCAL_TZ).strftime("%Y-%m-%d %H:%M:%S")


def _load_env_gemini_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key:
        return key
    env_file = APP_DIR / ".env"
    if env_file.exists():
        try:
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception:
            pass
    return ""


def init_db() -> None:
    with database.connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS directorio_empresas (
                id_empresa INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                sector TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS directorio_ubicaciones (
                id_ubicacion INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL DEFAULT 'Nacional',
                pais TEXT NOT NULL,
                estado TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS directorio_contactos (
                id_contacto INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_completo TEXT NOT NULL,
                puesto TEXT,
                correo TEXT,
                telefono TEXT,
                telefono_2 TEXT,
                id_empresa INTEGER,
                empresa_nombre TEXT,
                id_ubicacion INTEGER,
                ubicacion_texto TEXT,
                sitio_web TEXT,
                direccion TEXT,
                notas TEXT,
                foto_tarjeta TEXT,
                origen TEXT DEFAULT 'manual',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        try:
            db.execute("ALTER TABLE directorio_contactos ADD COLUMN foto_tarjeta TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE directorio_contactos ADD COLUMN foto_tarjeta_reverso TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE directorio_contactos ADD COLUMN ubicacion_tipo TEXT NOT NULL DEFAULT 'Nacional'")
        except Exception:
            pass
        try:
            db.execute(
                """
                UPDATE directorio_contactos
                SET ubicacion_tipo = 'Nacional'
                WHERE ubicacion_tipo IS NULL OR ubicacion_tipo = '' OR ubicacion_tipo NOT IN ('Nacional', 'Internacional')
                """
            )
        except Exception:
            pass
    _maybe_migrate_legacy_data()
    sync_missing_catalogs_from_contacts()



def normalize_company_key(name: str) -> str:
    if not name:
        return ""
    import unicodedata, re
    text = unicodedata.normalize('NFKD', str(name)).encode('ASCII', 'ignore').decode('utf-8').lower()
    patterns = [
        r'\bs\.?a\.?p\.?i\.?\s+de\s+c\.?v\.?\b',
        r'\bs\.?a\.?p\.?i\.?\b',
        r'\bs\.?\s*de\s*r\.?l\.?\s*de\s*c\.?v\.?\b',
        r'\bs\.?a\.?\s*de\s*c\.?v\.?\b',
        r'\bde\s+c\.?v\.?\b',
        r'\bs\.?a\.?\b',
        r'\bs\.?c\.?\b',
        r'\binc\.?\b',
        r'\bllc\.?\b',
        r'\bltd\.?\b',
        r'\bcorp(oration)?\.?\b',
        r'\bgmbh\b',
        r'\bco(mpany)?\.?\b',
    ]
    for p in patterns:
        text = re.sub(p, ' ', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def choose_canonical_company_name(names: list[str]) -> str:
    if not names:
        return ""
    def score(name: str) -> int:
        s = 0
        if len(name) > 4 and name.isupper():
            s -= 10
        if any(suff in name.upper() for suff in ["S.A. DE C.V.", "SA DE CV", "S.A.P.I.", "S. DE R.L."]):
            s -= 5
        if any(c in name for c in "áéíóúÁÉÍÓÚñÑ"):
            s += 5
        s -= abs(len(name) - 18)
        return s
    return max(names, key=score)


def find_matching_empresa(raw_name: str, existing_empresas: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not raw_name:
        return None
    raw_lower = raw_name.strip().lower()
    for e in existing_empresas:
        if e["nombre"].strip().lower() == raw_lower:
            return e

    target_key = normalize_company_key(raw_name)
    if not target_key:
        return None

    for e in existing_empresas:
        if normalize_company_key(e["nombre"]) == target_key:
            return e

    target_tokens = set(target_key.split())
    for e in existing_empresas:
        e_key = normalize_company_key(e["nombre"])
        e_tokens = set(e_key.split())
        common = target_tokens.intersection(e_tokens)
        if len(common) >= 2 and (target_tokens.issubset(e_tokens) or e_tokens.issubset(target_tokens)):
            return e

    return None


STATE_SYNONYMS: dict[str, list[str]] = {
    "Querétaro": ["qro", "queretaro", "santiago de queretaro"],
    "Nuevo León": ["nl", "nuevo leon", "monterrey", "san pedro garza", "apodaca", "guadalupe", "san nicolas"],
    "Guanajuato": ["gto", "guanajuato", "leon", "irapuato", "silao", "celaya", "salamanca"],
    "Jalisco": ["jal", "jalisco", "guadalajara", "zapopan", "tlaquepaque", "tonala"],
    "Ciudad de México": ["cdmx", "df", "distrito federal", "ciudad de mexico"],
    "Estado de México": ["edomex", "edo mex", "estado de mexico", "toluca", "naucalpan", "tlalnepantla"],
    "Coahuila": ["coah", "coahuila", "saltillo", "torreon", "ramos arizpe"],
    "San Luis Potosí": ["slp", "san luis potosi", "san luis"],
    "Puebla": ["pue", "puebla"],
    "Chihuahua": ["chih", "chihuahua", "juarez", "ciudad juarez"],
    "Sonora": ["son", "sonora", "hermosillo", "nogales"],
    "Baja California": ["bc", "baja california", "tijuana", "mexicali", "ensenada"],
    "Aguascalientes": ["ags", "aguascalientes"],
    "Tamaulipas": ["tamps", "tamaulipas", "reynosa", "matamoros", "nuevo laredo", "tampico"],
    "Veracruz": ["ver", "veracruz", "xalapa", "coatzacoalcos"],
    "Yucatán": ["yuc", "yucatan", "merida"],
}


def find_matching_ubicacion(raw_ubicacion: str, existing_ubicaciones: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not raw_ubicacion:
        return None
    import unicodedata, re
    text = unicodedata.normalize('NFKD', str(raw_ubicacion)).encode('ASCII', 'ignore').decode('utf-8').lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    tokens = set(text.split())

    for canonical_state, syns in STATE_SYNONYMS.items():
        if any(s in text or s in tokens for s in syns):
            canonical_lower = unicodedata.normalize('NFKD', canonical_state).encode('ASCII', 'ignore').decode('utf-8').lower()
            for u in existing_ubicaciones:
                u_estado_clean = unicodedata.normalize('NFKD', u["estado"]).encode('ASCII', 'ignore').decode('utf-8').lower()
                if canonical_lower == u_estado_clean:
                    return u
            return {"id_ubicacion": None, "estado": canonical_state, "pais": "México", "tipo": "Nacional"}

    return None


def unify_catalogs() -> dict[str, Any]:
    now = _now_iso()
    unified_companies_count = 0
    unified_contacts_count = 0
    details: list[str] = []

    with database.connect() as db:
        # A) UNIFICAR EMPRESAS EXISTENTES EN CATÁLOGO
        empresas = [dict(r) for r in db.execute("SELECT id_empresa, nombre, sector FROM directorio_empresas").fetchall()]
        groups: dict[str, list[dict[str, Any]]] = {}
        for emp in empresas:
            key = normalize_company_key(emp["nombre"])
            if key:
                groups.setdefault(key, []).append(emp)

        for key, emp_list in groups.items():
            if len(emp_list) > 1:
                names = [e["nombre"] for e in emp_list]
                canonical_name = choose_canonical_company_name(names)
                canonical_emp = next((e for e in emp_list if e["nombre"] == canonical_name), emp_list[0])
                canonical_id = canonical_emp["id_empresa"]

                other_ids = [e["id_empresa"] for e in emp_list if e["id_empresa"] != canonical_id]
                for oid in other_ids:
                    db.execute(
                        "UPDATE directorio_contactos SET id_empresa = ?, empresa_nombre = ?, updated_at = ? WHERE id_empresa = ?",
                        (canonical_id, canonical_name, now, oid),
                    )
                    db.execute("DELETE FROM directorio_empresas WHERE id_empresa = ?", (oid,))

                for name in names:
                    if name != canonical_name:
                        db.execute(
                            "UPDATE directorio_contactos SET id_empresa = ?, empresa_nombre = ?, updated_at = ? WHERE LOWER(TRIM(empresa_nombre)) = LOWER(TRIM(?))",
                            (canonical_id, canonical_name, now, name),
                        )

                unified_companies_count += len(other_ids)
                details.append(f"Empresas unificadas: {', '.join(names)} -> '{canonical_name}'")

        # B) ACTUALIZAR CONTACTOS QUE TENGAN VARIACIONES A LA EMPRESA CANÓNICA
        canonical_empresas = [dict(r) for r in db.execute("SELECT id_empresa, nombre FROM directorio_empresas").fetchall()]
        contacts = [dict(r) for r in db.execute("SELECT id_contacto, empresa_nombre, id_empresa FROM directorio_contactos WHERE empresa_nombre IS NOT NULL AND TRIM(empresa_nombre) != ''").fetchall()]
        for c in contacts:
            c_name = c["empresa_nombre"]
            matched = find_matching_empresa(c_name, canonical_empresas)
            if matched and (c["empresa_nombre"] != matched["nombre"] or c["id_empresa"] != matched["id_empresa"]):
                db.execute(
                    "UPDATE directorio_contactos SET id_empresa = ?, empresa_nombre = ?, updated_at = ? WHERE id_contacto = ?",
                    (matched["id_empresa"], matched["nombre"], now, c["id_contacto"]),
                )
                unified_contacts_count += 1

        # C) NORMALIZAR UBICACIONES EN CONTACTOS
        canonical_ubis = [dict(r) for r in db.execute("SELECT id_ubicacion, tipo, pais, estado FROM directorio_ubicaciones").fetchall()]
        contacts_ubi = [dict(r) for r in db.execute("SELECT id_contacto, ubicacion_texto, id_ubicacion, ubicacion_tipo FROM directorio_contactos WHERE ubicacion_texto IS NOT NULL AND TRIM(ubicacion_texto) != ''").fetchall()]
        for cu in contacts_ubi:
            m_ubi = find_matching_ubicacion(cu["ubicacion_texto"], canonical_ubis)
            if m_ubi and m_ubi.get("id_ubicacion") and cu["id_ubicacion"] != m_ubi["id_ubicacion"]:
                db.execute(
                    "UPDATE directorio_contactos SET id_ubicacion = ?, ubicacion_tipo = ?, updated_at = ? WHERE id_contacto = ?",
                    (m_ubi["id_ubicacion"], m_ubi["tipo"], now, cu["id_contacto"]),
                )

    return {
        "ok": True,
        "unified_companies": unified_companies_count,
        "unified_contacts": unified_contacts_count,
        "details": details,
        "catalogs": get_catalogs(),
    }

def sync_missing_catalogs_from_contacts() -> None:
    now = _now_iso()
    try:
        with database.connect() as db:
            # Sincronizar empresas de contactos ya existentes
            rows = db.execute(
                """
                SELECT DISTINCT empresa_nombre
                FROM directorio_contactos
                WHERE empresa_nombre IS NOT NULL AND TRIM(empresa_nombre) != ''
                """
            ).fetchall()
            for r in rows:
                name = str(r["empresa_nombre"]).strip()
                if not name:
                    continue
                exists = db.execute(
                    "SELECT 1 FROM directorio_empresas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))",
                    (name,)
                ).fetchone()
                if not exists:
                    try:
                        db.execute(
                            "INSERT INTO directorio_empresas (nombre, sector, created_at) VALUES (?, ?, ?)",
                            (name, "", now),
                        )
                    except Exception:
                        pass

            # Sincronizar ubicaciones de contactos ya existentes
            ubi_rows = db.execute(
                """
                SELECT DISTINCT ubicacion_texto
                FROM directorio_contactos
                WHERE ubicacion_texto IS NOT NULL AND TRIM(ubicacion_texto) != ''
                """
            ).fetchall()
            for r in ubi_rows:
                raw = str(r["ubicacion_texto"]).strip()
                if not raw:
                    continue
                parts = [p.strip() for p in raw.split(",") if p.strip()]
                if len(parts) >= 2:
                    estado, pais = parts[-2], parts[-1]
                else:
                    estado, pais = parts[0], "México"
                pais_norm = pais.lower().replace("é", "e")
                tipo = "Nacional" if pais_norm in ("mexico", "mx", "") or "mexico" in pais_norm else "Internacional"
                if tipo == "Nacional":
                    pais = "México"
                exists = db.execute(
                    "SELECT 1 FROM directorio_ubicaciones WHERE LOWER(TRIM(estado)) = LOWER(TRIM(?)) AND LOWER(TRIM(pais)) = LOWER(TRIM(?))",
                    (estado, pais),
                ).fetchone()
                if not exists:
                    try:
                        db.execute(
                            "INSERT INTO directorio_ubicaciones (tipo, pais, estado, created_at) VALUES (?, ?, ?, ?)",
                            (tipo, pais, estado, now),
                        )
                    except Exception:
                        pass
    except Exception as exc:
        print(f"[Directorio] Sincronización inicial de catálogos omitida/advertencia: {exc}")


def _maybe_migrate_legacy_data() -> None:
    if not LEGACY_DB_PATH.exists():
        return
    try:
        with database.connect() as db:
            row = db.execute("SELECT COUNT(*) AS total FROM directorio_contactos").fetchone()
            if row and row["total"] > 0:
                return

            legacy_conn = sqlite3.connect(LEGACY_DB_PATH)
            legacy_conn.row_factory = sqlite3.Row

            emp_cursor = legacy_conn.cursor()
            emp_cursor.execute("SELECT id_empresa, nombre, sector FROM Empresas")
            for emp in emp_cursor.fetchall():
                try:
                    db.execute(
                        "INSERT INTO directorio_empresas (nombre, sector, created_at) VALUES (?, ?, ?)",
                        (emp["nombre"], emp["sector"] or "", _now_iso()),
                    )
                except Exception:
                    pass

            ubi_cursor = legacy_conn.cursor()
            ubi_cursor.execute("SELECT id_ubicacion, tipo, pais, estado FROM Ubicaciones")
            for ubi in ubi_cursor.fetchall():
                try:
                    db.execute(
                        "INSERT INTO directorio_ubicaciones (tipo, pais, estado, created_at) VALUES (?, ?, ?, ?)",
                        (ubi["tipo"] or "Nacional", ubi["pais"], ubi["estado"], _now_iso()),
                    )
                except Exception:
                    pass

            con_cursor = legacy_conn.cursor()
            con_cursor.execute(
                """
                SELECT c.nombre_completo, c.puesto, c.correo, c.telefono,
                       e.nombre AS empresa_nombre,
                       u.tipo AS ubi_tipo, u.estado AS ubi_estado, u.pais AS ubi_pais
                FROM Contactos c
                LEFT JOIN Empresas e ON c.id_empresa = e.id_empresa
                LEFT JOIN Ubicaciones u ON c.id_ubicacion = u.id_ubicacion
                """
            )
            for con in con_cursor.fetchall():
                emp_name = con["empresa_nombre"] or ""
                ubi_str = ""
                if con["ubi_estado"] or con["ubi_pais"]:
                    ubi_str = f"{con['ubi_estado'] or ''}, {con['ubi_pais'] or ''}".strip(", ")

                now = _now_iso()
                db.execute(
                    """
                    INSERT INTO directorio_contactos (
                        nombre_completo, puesto, correo, telefono, telefono_2,
                        empresa_nombre, ubicacion_texto, sitio_web, direccion,
                        notas, origen, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        con["nombre_completo"] or "Sin nombre",
                        con["puesto"] or "",
                        con["correo"] or "",
                        con["telefono"] or "",
                        "",
                        emp_name,
                        ubi_str,
                        "",
                        "",
                        "Migrado automáticamente de sistema previo",
                        "migracion",
                        now,
                        now,
                    ),
                )
            legacy_conn.close()
    except Exception as exc:
        print(f"[Directorio] Migración inicial omitida o con advertencia: {exc}")


def list_contacts(search: str = "", empresa: str = "", tipo_ubicacion: str = "") -> list[dict[str, Any]]:
    search = search.strip().lower()
    empresa = empresa.strip()
    tipo_ubicacion = tipo_ubicacion.strip()

    sql = """
        SELECT c.*,
               COALESCE(e.nombre, c.empresa_nombre, '') AS empresa_display,
               COALESCE(
                   CASE WHEN u.estado IS NOT NULL AND u.pais IS NOT NULL
                        THEN u.estado || ', ' || u.pais
                        ELSE c.ubicacion_texto
                   END, ''
               ) AS ubicacion_display,
               COALESCE(NULLIF(c.ubicacion_tipo, ''), u.tipo, 'Nacional') AS ubicacion_tipo
        FROM directorio_contactos c
        LEFT JOIN directorio_empresas e ON c.id_empresa = e.id_empresa
        LEFT JOIN directorio_ubicaciones u ON c.id_ubicacion = u.id_ubicacion
        WHERE 1=1
    """
    params: list[Any] = []

    if empresa and empresa != "Todos":
        sql += " AND (e.nombre = ? OR c.empresa_nombre = ?)"
        params.extend([empresa, empresa])

    if tipo_ubicacion and tipo_ubicacion != "Todos":
        sql += " AND COALESCE(NULLIF(c.ubicacion_tipo, ''), u.tipo, 'Nacional') = ?"
        params.append(tipo_ubicacion)

    sql += " ORDER BY c.nombre_completo ASC"

    with database.connect() as db:
        rows = db.execute(sql, params).fetchall()

    result = []
    for r in rows:
        d = dict(r)
        if search:
            blob = f"{d.get('nombre_completo', '')} {d.get('puesto', '')} {d.get('correo', '')} {d.get('telefono', '')} {d.get('empresa_display', '')} {d.get('ubicacion_display', '')}".lower()
            if search not in blob:
                continue
        result.append(d)
    return result


def get_contact(id_contacto: int) -> dict[str, Any] | None:
    with database.connect() as db:
        row = db.execute(
            """
            SELECT c.*,
                   COALESCE(e.nombre, c.empresa_nombre, '') AS empresa_display,
                   COALESCE(
                       CASE WHEN u.estado IS NOT NULL AND u.pais IS NOT NULL
                            THEN u.estado || ', ' || u.pais
                            ELSE c.ubicacion_texto
                       END, ''
                   ) AS ubicacion_display,
                   COALESCE(NULLIF(c.ubicacion_tipo, ''), u.tipo, 'Nacional') AS ubicacion_tipo
            FROM directorio_contactos c
            LEFT JOIN directorio_empresas e ON c.id_empresa = e.id_empresa
            LEFT JOIN directorio_ubicaciones u ON c.id_ubicacion = u.id_ubicacion
            WHERE c.id_contacto = ?
            """,
            (id_contacto,),
        ).fetchone()
        return dict(row) if row else None


def save_contact(payload: dict[str, Any]) -> dict[str, Any]:
    id_contacto = payload.get("id_contacto")
    nombre = str(payload.get("nombre_completo", "")).strip()
    if not nombre:
        raise ValueError("El nombre completo es obligatorio")

    puesto = str(payload.get("puesto", "")).strip()
    correo = str(payload.get("correo", "")).strip()
    telefono = str(payload.get("telefono", "")).strip()
    telefono_2 = str(payload.get("telefono_2", "")).strip()
    empresa_nombre = str(payload.get("empresa_nombre", "")).strip()
    id_empresa = payload.get("id_empresa")
    if id_empresa in ("", None, "null"):
        id_empresa = None
    else:
        id_empresa = int(id_empresa)

    ubicacion_texto = str(payload.get("ubicacion_texto", "")).strip()
    id_ubicacion = payload.get("id_ubicacion")
    if id_ubicacion in ("", None, "null"):
        id_ubicacion = None
    else:
        id_ubicacion = int(id_ubicacion)

    sitio_web = str(payload.get("sitio_web", "")).strip()
    direccion = str(payload.get("direccion", "")).strip()
    notas = str(payload.get("notas", "")).strip()
    foto_tarjeta = str(payload.get("foto_tarjeta", "")).strip()
    foto_tarjeta_reverso = str(payload.get("foto_tarjeta_reverso", "")).strip()
    ubicacion_tipo = str(payload.get("ubicacion_tipo", "")).strip()
    if ubicacion_tipo not in ("Nacional", "Internacional"):
        raw_u = (ubicacion_texto or "").lower()
        if any(t in raw_u for t in ["méxico", "mexico", "nuevo león", "monterrey", "querétaro", "queretaro", "qro", "guadalajara", "cdmx", "león", "leon", "gto", "nl", "mx"]):
            ubicacion_tipo = "Nacional"
        elif any(t in raw_u for t in ["usa", "united states", "japan", "germany", "china", "canada"]):
            ubicacion_tipo = "Internacional"
        else:
            ubicacion_tipo = "Nacional"

    origen = str(payload.get("origen", "manual")).strip()

    now = _now_iso()

    with database.connect() as db:
        # 1. EMPRESA: Buscar con detección inteligente y canónica (ej. NT TOOL DE MEXICO S.A. DE C.V. == NT Tool de México)
        if empresa_nombre:
            existing_empresas = [
                dict(r) for r in db.execute("SELECT id_empresa, nombre, sector FROM directorio_empresas").fetchall()
            ]
            matched_emp = find_matching_empresa(empresa_nombre, existing_empresas)
            if matched_emp:
                id_empresa = matched_emp["id_empresa"]
                empresa_nombre = matched_emp["nombre"]
            else:
                try:
                    db.execute(
                        "INSERT INTO directorio_empresas (nombre, sector, created_at) VALUES (?, ?, ?)",
                        (empresa_nombre, "", now),
                    )
                    new_emp = db.execute(
                        "SELECT id_empresa FROM directorio_empresas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))",
                        (empresa_nombre,),
                    ).fetchone()
                    if new_emp:
                        id_empresa = new_emp["id_empresa"]
                except Exception as exc:
                    print(f"[Directorio] Auto-registro empresa omitido/existente: {exc}")

        # 2. UBICACIÓN: Buscar o crear automáticamente con detección inteligente
        if ubicacion_texto:
            existing_ubis = [
                dict(r) for r in db.execute("SELECT id_ubicacion, tipo, pais, estado FROM directorio_ubicaciones").fetchall()
            ]
            matched_u = find_matching_ubicacion(ubicacion_texto, existing_ubis)
            if matched_u and matched_u.get("id_ubicacion"):
                id_ubicacion = matched_u["id_ubicacion"]
                if not payload.get("ubicacion_tipo"):
                    ubicacion_tipo = matched_u["tipo"]
            else:
                ubi_row = db.execute(
                    """
                    SELECT id_ubicacion, pais, estado FROM directorio_ubicaciones
                    WHERE LOWER(?) LIKE '%' || LOWER(TRIM(estado)) || '%'
                    ORDER BY LENGTH(estado) DESC LIMIT 1
                    """,
                    (ubicacion_texto,),
                ).fetchone()
                if ubi_row:
                    id_ubicacion = ubi_row["id_ubicacion"]

            if not id_ubicacion:
                parts = [p.strip() for p in ubicacion_texto.split(",") if p.strip()]
                if len(parts) >= 2:
                    posible_estado = parts[-2]
                    posible_pais = parts[-1]
                elif len(parts) == 1:
                    posible_estado = parts[0]
                    posible_pais = "México"
                else:
                    posible_estado = ""
                    posible_pais = ""

                if posible_estado:
                    pais_norm = posible_pais.lower().replace("é", "e")
                    if pais_norm in ("mexico", "mx", "") or "mexico" in pais_norm:
                        tipo_ubi = "Nacional"
                        posible_pais = "México"
                    else:
                        tipo_ubi = "Internacional"

                    try:
                        existing_ubi = db.execute(
                            "SELECT id_ubicacion FROM directorio_ubicaciones WHERE LOWER(TRIM(estado)) = LOWER(TRIM(?)) AND LOWER(TRIM(pais)) = LOWER(TRIM(?))",
                            (posible_estado, posible_pais),
                        ).fetchone()
                        if existing_ubi:
                            id_ubicacion = existing_ubi["id_ubicacion"]
                        else:
                            db.execute(
                                "INSERT INTO directorio_ubicaciones (tipo, pais, estado, created_at) VALUES (?, ?, ?, ?)",
                                (tipo_ubi, posible_pais, posible_estado, now),
                            )
                            new_ubi = db.execute(
                                "SELECT id_ubicacion FROM directorio_ubicaciones WHERE LOWER(TRIM(estado)) = LOWER(TRIM(?)) AND LOWER(TRIM(pais)) = LOWER(TRIM(?))",
                                (posible_estado, posible_pais),
                            ).fetchone()
                            if new_ubi:
                                id_ubicacion = new_ubi["id_ubicacion"]
                    except Exception as exc:
                        print(f"[Directorio] Auto-registro ubicación omitido/existente: {exc}")

        if id_contacto:
            db.execute(
                """
                UPDATE directorio_contactos SET
                    nombre_completo = ?, puesto = ?, correo = ?, telefono = ?, telefono_2 = ?,
                    id_empresa = ?, empresa_nombre = ?, id_ubicacion = ?, ubicacion_texto = ?,
                    ubicacion_tipo = ?, sitio_web = ?, direccion = ?, notas = ?,
                    foto_tarjeta = CASE WHEN ? != '' THEN ? ELSE foto_tarjeta END,
                    foto_tarjeta_reverso = CASE WHEN ? != '' THEN ? ELSE foto_tarjeta_reverso END,
                    updated_at = ?
                WHERE id_contacto = ?
                """,
                (
                    nombre, puesto, correo, telefono, telefono_2,
                    id_empresa, empresa_nombre, id_ubicacion, ubicacion_texto,
                    ubicacion_tipo, sitio_web, direccion, notas,
                    foto_tarjeta, foto_tarjeta,
                    foto_tarjeta_reverso, foto_tarjeta_reverso,
                    now, int(id_contacto)
                ),
            )
            saved_id = int(id_contacto)
        else:
            cur = db.execute(
                """
                INSERT INTO directorio_contactos (
                    nombre_completo, puesto, correo, telefono, telefono_2,
                    id_empresa, empresa_nombre, id_ubicacion, ubicacion_texto,
                    ubicacion_tipo, sitio_web, direccion, notas, foto_tarjeta, foto_tarjeta_reverso, origen, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    nombre, puesto, correo, telefono, telefono_2,
                    id_empresa, empresa_nombre, id_ubicacion, ubicacion_texto,
                    ubicacion_tipo, sitio_web, direccion, notas,
                    foto_tarjeta, foto_tarjeta_reverso, origen, now, now
                ),
            )
            saved_id = cur.lastrowid

    contact = get_contact(saved_id)
    return {"ok": True, "contact": contact}


def delete_contact(id_contacto: int) -> dict[str, Any]:
    with database.connect() as db:
        db.execute("DELETE FROM directorio_contactos WHERE id_contacto = ?", (id_contacto,))
    return {"ok": True, "id_contacto": id_contacto}


def get_catalogs() -> dict[str, Any]:
    with database.connect() as db:
        empresas = [dict(r) for r in db.execute("SELECT id_empresa, nombre, sector FROM directorio_empresas ORDER BY nombre ASC").fetchall()]
        ubicaciones = [dict(r) for r in db.execute("SELECT id_ubicacion, tipo, pais, estado FROM directorio_ubicaciones ORDER BY pais, estado ASC").fetchall()]
    return {"empresas": empresas, "ubicaciones": ubicaciones}


def save_empresa(nombre: str, sector: str = "") -> dict[str, Any]:
    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre de la empresa es obligatorio")
    with database.connect() as db:
        try:
            db.execute(
                "INSERT INTO directorio_empresas (nombre, sector, created_at) VALUES (?, ?, ?)",
                (nombre, sector.strip(), _now_iso()),
            )
        except Exception:
            pass
    return {"ok": True, "catalogs": get_catalogs()}


def save_ubicacion(tipo: str, pais: str, estado: str) -> dict[str, Any]:
    pais = pais.strip()
    estado = estado.strip()
    if not pais or not estado:
        raise ValueError("País y estado son obligatorios")
    tipo = "Internacional" if tipo == "Internacional" else "Nacional"
    with database.connect() as db:
        try:
            db.execute(
                "INSERT INTO directorio_ubicaciones (tipo, pais, estado, created_at) VALUES (?, ?, ?, ?)",
                (tipo, pais, estado, _now_iso()),
            )
        except Exception:
            pass
    return {"ok": True, "catalogs": get_catalogs()}


def generate_vcard(id_contacto: int) -> tuple[str, str]:
    c = get_contact(id_contacto)
    if not c:
        raise ValueError("Contacto no encontrado")

    full_name = c.get("nombre_completo", "Contacto")
    parts = full_name.split()
    last_name = parts[-1] if len(parts) > 1 else ""
    first_name = " ".join(parts[:-1]) if len(parts) > 1 else full_name

    vcard_lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"FN:{full_name}",
        f"N:{last_name};{first_name};;;",
    ]
    if c.get("empresa_display"):
        vcard_lines.append(f"ORG:{c['empresa_display']}")
    if c.get("puesto"):
        vcard_lines.append(f"TITLE:{c['puesto']}")
    if c.get("correo"):
        vcard_lines.append(f"EMAIL;TYPE=INTERNET,WORK:{c['correo']}")
    if c.get("telefono"):
        vcard_lines.append(f"TEL;TYPE=CELL,VOICE:{c['telefono']}")
    if c.get("telefono_2"):
        vcard_lines.append(f"TEL;TYPE=WORK,VOICE:{c['telefono_2']}")
    if c.get("sitio_web"):
        vcard_lines.append(f"URL:{c['sitio_web']}")
    if c.get("direccion") or c.get("ubicacion_display"):
        addr = c.get("direccion") or c.get("ubicacion_display")
        vcard_lines.append(f"ADR;TYPE=WORK:;;{addr};;;;")
    if c.get("notas"):
        vcard_lines.append(f"NOTE:{c['notas']}")
    vcard_lines.append("END:VCARD\r\n")

    filename = re.sub(r"[^\w\s-]", "", full_name).strip().replace(" ", "_") or "contacto"
    return "\r\n".join(vcard_lines), f"{filename}.vcf"


def _clean_and_parse_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
    return json.loads(text)


def _get_supported_gemini_models(api_key: str) -> list[str]:
    """Descubre los modelos con soporte generateContent disponibles para la clave actual."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        req = urllib.request.Request(url, headers={"User-Agent": "Directorio-App"}, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = []
            for item in data.get("models", []):
                methods = item.get("supportedGenerationMethods", [])
                if "generateContent" in methods:
                    # Formato "models/gemini-..." -> extraer "gemini-..."
                    name = item.get("name", "").replace("models/", "").strip()
                    if name:
                        models.append(name)
            if models:
                def _priority(m):
                    ml = m.lower()
                    if "2.0-flash" in ml and "lite" not in ml: return 1
                    if "2.5-flash" in ml: return 2
                    if "1.5-flash" in ml: return 3
                    if "flash" in ml: return 4
                    return 10
                models.sort(key=_priority)
                return models
    except Exception as exc:
        print(f"[Directorio AI] No se pudo listar modelos dinámicamente: {exc}", flush=True)
    return []


def scan_card_ai(
    image_base64: str,
    mime_type: str = "image/jpeg",
    back_image_base64: str = "",
    back_mime_type: str = "image/jpeg",
) -> dict[str, Any]:
    api_key = _load_env_gemini_key()
    if not api_key:
        return {
            "ok": False,
            "extracted": {},
            "message": "GEMINI_API_KEY no configurada. Puedes ingresar los datos manualmente.",
        }

    # Limpiar prefijo data URI si viene presente en imagen frontal
    if "," in image_base64:
        header, image_base64 = image_base64.split(",", 1)
        if "image/png" in header:
            mime_type = "image/png"
        elif "image/webp" in header:
            mime_type = "image/webp"
        elif "image/heic" in header:
            mime_type = "image/heic"
        else:
            mime_type = "image/jpeg"

    # Limpiar prefijo data URI si viene presente en imagen trasera
    if back_image_base64 and "," in back_image_base64:
        b_header, back_image_base64 = back_image_base64.split(",", 1)
        if "image/png" in b_header:
            back_mime_type = "image/png"
        elif "image/webp" in b_header:
            back_mime_type = "image/webp"
        elif "image/heic" in b_header:
            back_mime_type = "image/heic"
        else:
            back_mime_type = "image/jpeg"

    prompt = (
        "Eres un asistente experto en digitalización de tarjetas de presentación de negocios y corporativas. "
        "Analiza minuciosamente la(s) imagen(es) de la tarjeta provista (FRENTE y, si existe, REVERSO) y consolida los datos del contacto en un único registro. "
        "Devuelve ÚNICAMENTE un objeto JSON válido con los siguientes campos estrictos:\n"
        "{\n"
        '  "nombre_completo": "Nombre de la persona (no de la empresa, sin títulos como Lic. o Ing. a menos que formen parte del nombre)",\n'
        '  "puesto": "Cargo o puesto del contacto (ej. Director de Ventas, Sales Manager, etc.)",\n'
        '  "empresa": "Nombre comercial o corporativo de la empresa u organización",\n'
        '  "telefono": "Teléfono principal o móvil con lada",\n'
        '  "telefono_2": "Teléfono secundario o conmutador con extensión si existe, de lo contrario vacío",\n'
        '  "correo": "Correo electrónico corporativo o personal",\n'
        '  "sitio_web": "Página web de la empresa",\n'
        '  "direccion": "Dirección física (calle, número, colonia, ciudad, código postal)",\n'
        '  "notas": "Cualquier información adicional relevante como eslogan, redes o servicios mencionados"\n'
        "}\n"
        "Si algún campo no aparece en la tarjeta, déjalo como cadena vacía ''. No inventes datos."
    )

    # Detectar dinámicamente qué modelos tiene disponibles esta API Key en Google
    available_models = _get_supported_gemini_models(api_key)
    env_model = os.environ.get("GEMINI_MODEL", "").strip()

    candidate_models = []
    if env_model:
        candidate_models.append(env_model)
    candidate_models.extend(available_models)
    # Modelos de respaldo estándar
    candidate_models.extend(["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite"])

    # Deduplicar manteniendo orden
    models_to_try = []
    for m in candidate_models:
        if m and m not in models_to_try:
            models_to_try.append(m)

    parts: list[dict[str, Any]] = [
        {"text": prompt},
        {
            "inline_data": {
                "mime_type": mime_type,
                "data": image_base64,
            }
        },
    ]
    if back_image_base64:
        parts.append(
            {
                "inline_data": {
                    "mime_type": back_mime_type,
                    "data": back_image_base64,
                }
            }
        )

    req_body = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
            "maxOutputTokens": 800,
        },
    }

    last_error_msg = ""
    for idx, model_name in enumerate(models_to_try):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(req_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates") or []
                if not candidates:
                    continue
                parts = candidates[0].get("content", {}).get("parts") or []
                if not parts or "text" not in parts[0]:
                    continue
                content_text = parts[0]["text"]
                parsed_json = _clean_and_parse_json(content_text)
                return {"ok": True, "extracted": parsed_json, "model_used": model_name}
        except urllib.error.HTTPError as exc:
            err_msg = exc.read().decode("utf-8", errors="replace")
            try:
                err_json = json.loads(err_msg)
                msg = err_json.get("error", {}).get("message", err_msg)
            except Exception:
                msg = err_msg
            last_error_msg = msg
            print(f"[Directorio AI] Aviso HTTP {exc.code} con {model_name}: {msg}", flush=True)
            time.sleep(0.3)
            continue
        except Exception as exc:
            last_error_msg = str(exc)
            print(f"[Directorio AI] Aviso con {model_name}: {exc}", flush=True)
            time.sleep(0.3)
            continue

    # Si ningún modelo pudo procesar la imagen, se responde ok=False pero SIN error 500
    return {
        "ok": False,
        "extracted": {},
        "message": f"No se pudo extraer texto automáticamente ({last_error_msg}). Puedes ingresar los datos manualmente.",
    }

