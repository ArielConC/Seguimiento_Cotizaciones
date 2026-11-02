from __future__ import annotations

import base64
import json
import os
import re
import sqlite3
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
                origen TEXT DEFAULT 'manual',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
    _maybe_migrate_legacy_data()


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
               COALESCE(u.tipo, '') AS ubicacion_tipo
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
        sql += " AND u.tipo = ?"
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
                   ) AS ubicacion_display
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
    origen = str(payload.get("origen", "manual")).strip()

    now = _now_iso()

    with database.connect() as db:
        # Si se especificó nombre de empresa pero no id, buscar o crear
        if empresa_nombre and not id_empresa:
            emp_row = db.execute("SELECT id_empresa FROM directorio_empresas WHERE LOWER(nombre) = LOWER(?)", (empresa_nombre,)).fetchone()
            if emp_row:
                id_empresa = emp_row["id_empresa"]

        if id_contacto:
            db.execute(
                """
                UPDATE directorio_contactos SET
                    nombre_completo = ?, puesto = ?, correo = ?, telefono = ?, telefono_2 = ?,
                    id_empresa = ?, empresa_nombre = ?, id_ubicacion = ?, ubicacion_texto = ?,
                    sitio_web = ?, direccion = ?, notas = ?, updated_at = ?
                WHERE id_contacto = ?
                """,
                (
                    nombre, puesto, correo, telefono, telefono_2,
                    id_empresa, empresa_nombre, id_ubicacion, ubicacion_texto,
                    sitio_web, direccion, notas, now, int(id_contacto)
                ),
            )
            saved_id = int(id_contacto)
        else:
            cur = db.execute(
                """
                INSERT INTO directorio_contactos (
                    nombre_completo, puesto, correo, telefono, telefono_2,
                    id_empresa, empresa_nombre, id_ubicacion, ubicacion_texto,
                    sitio_web, direccion, notas, origen, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    nombre, puesto, correo, telefono, telefono_2,
                    id_empresa, empresa_nombre, id_ubicacion, ubicacion_texto,
                    sitio_web, direccion, notas, origen, now, now
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
        db.execute(
            "INSERT INTO directorio_empresas (nombre, sector, created_at) VALUES (?, ?, ?)",
            (nombre, sector.strip(), _now_iso()),
        )
    return {"ok": True, "catalogs": get_catalogs()}


def save_ubicacion(tipo: str, pais: str, estado: str) -> dict[str, Any]:
    pais = pais.strip()
    estado = estado.strip()
    if not pais or not estado:
        raise ValueError("País y estado son obligatorios")
    tipo = "Internacional" if tipo == "Internacional" else "Nacional"
    with database.connect() as db:
        db.execute(
            "INSERT INTO directorio_ubicaciones (tipo, pais, estado, created_at) VALUES (?, ?, ?, ?)",
            (tipo, pais, estado, _now_iso()),
        )
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


def scan_card_ai(image_base64: str, mime_type: str = "image/jpeg") -> dict[str, Any]:
    api_key = _load_env_gemini_key()
    if not api_key:
        raise ValueError(
            "No se ha configurado la clave GEMINI_API_KEY. "
            "Por favor, agrégala en la variable de entorno o en un archivo .env para habilitar el escáner con IA."
        )

    # Limpiar prefijo data URI si viene presente
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

    prompt = (
        "Eres un asistente experto en digitalización de tarjetas de presentación de negocios y corporativas. "
        "Analiza minuciosamente la imagen de la tarjeta de presentación provista y extrae los datos del contacto. "
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    req_body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(req_body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed_json = json.loads(content_text)
            return {"ok": True, "extracted": parsed_json}
    except urllib.error.HTTPError as exc:
        err_msg = exc.read().decode("utf-8", errors="replace")
        try:
            err_json = json.loads(err_msg)
            msg = err_json.get("error", {}).get("message", err_msg)
        except Exception:
            msg = err_msg
        raise RuntimeError(f"Error en la API de Gemini: {msg}") from exc
    except Exception as exc:
        raise RuntimeError(f"Error al procesar la tarjeta con IA: {exc}") from exc

