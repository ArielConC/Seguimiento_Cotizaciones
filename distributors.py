from __future__ import annotations

import re
import unicodedata


# Source: "Listado y directorio de clientes.xls", sheet "Reporte de Compac",
# columns A:B.  The source codes are authoritative; a few are longer than
# three characters and must not be truncated.
CATALOG: tuple[tuple[str, str], ...] = (
    ("ACC", "ACCUROMM MEXICO"),
    ("AGA", "NOVELO HERRAMIENTAS DE CORTE Y SUJECION"),
    ("AGM", "AGMAQ"),
    ("AME", "AMERICAN CARBIDE DRILL´S"),
    ("ASA", "ASAHI SHO-KO-SHA MEXICO"),
    ("ASE", "ASSAHI MAQUINAS E EQUIPAMENTOS LTDA"),
    ("ASM", "ASSAHI MAQUINAS DA AMAZONIA LTDA"),
    ("ATL", "SEGUROS ATLAS"),
    ("BHM", "BLACKHAWK INDUSTRIAL DE MEXICO"),
    ("BTO", "BEST TOOLING OPTION"),
    ("CAM", "CORPORACION ARRENDADORA DE MAQUINAS PARA PRODUCCION"),
    ("CAROLINA", "CAROLINA TREJO CAMPS"),
    ("CER", "CERATIZIT MEXICO"),
    ("CIP", "COMERCIAL IP"),
    ("CNC", "CNC PORTAHERRAMIENTAS Y SUJECION"),
    ("COM", "COMINIX MEXICO"),
    ("CUT", "CUTTING TOOLS LV SA DE CV"),
    ("DAI", "DAITOU MEXICO"),
    ("DAL", "DALOZA TOOLS"),
    ("DM", "DM HERRAMIENTAS"),
    ("EQU", "EQUIMEC"),
    ("FAS", "FASTENAL MEXICO"),
    ("FUJ", "FUJI SYSTEMS MEXICO"),
    ("GGP", "G&G PROFESSIONAL CARBIDE TOOL"),
    ("GYF", "GARCIA Y FAJARDO HERRAMIENTAS Y ACCESORIOS"),
    ("HYJ", "H & J PRECISION TOOLS DE MEXICO"),
    ("HYT", "H & T METALS"),
    ("IDA", "IDAKA PRECISION TOOLS MEXICO"),
    ("IMP", "IMPHERCORT"),
    ("IZA", "IZAWA MEXICO"),
    ("KIM", "KOMATSU INDUSTRIES MEXICO"),
    ("KYO", "KYOCERA SGS PRECISION TOOLS MEXICO"),
    ("LDY", "LARS DYNAMICS"),
    ("MAY", "MAYA INTERNATIONAL TOOLS"),
    ("MIS", "MISUMI MEXICO"),
    ("MMC", "MITSUBISHI MATERIALS MEXICO"),
    ("NAC", "NACHI - TOKIWA MEXICO"),
    ("NTJPN", "NT TOOL CORPORATION"),
    ("NTUSA", "NT USA CORPORATION"),
    ("NUM", "NUMA INGENIERIA SA DE CV"),
    ("OKAYA", "OKAYA MEXICO"),
    ("OSG", "OSG ROYCO"),
    ("OSGBR", "OSG SULAMERICANA DE FERRAMENTAS LTDA"),
    ("PRM", "PROMAYHER"),
    ("PTS", "PTS PRECISION TOOLS SERVICE DE MEXICO"),
    ("QIN", "QIN INTERNACIONAL BUSINESS"),
    ("RDB", "R.D.B TOOLING"),
    ("REC", "RECTIFICACION ALAJUELENSE, S.A."),
    ("SMC", "SMC CORPORATION MEXICO"),
    ("SST", "MAKINO MEXICO"),
    ("SUI", "SUIMEX TOOLS"),
    ("SUM", "SUMITOMO ELECTRIC HARDMETAL DE MEXICO"),
    ("SUP", "SUPRA TOOL"),
    ("TEC", "TECHNIK-GO-PRO"),
    ("TOM", "TOMITA MEXICO"),
    ("UPT", "UPTECH AVANZADA TECNOLOGIA EN HERRAMIENTA DE CORTE S.A DE C."),
    ("YAM", "YAMAZEN MEXICANA"),
    ("YON", "YONEZAWA MEXICO"),
    ("YUA", "YUASA SHOJI MEXICO"),
)


def normalize_name(value: str) -> str:
    text = unicodedata.normalize("NFKC", str(value or ""))
    return re.sub(r"\s+", " ", text).strip().casefold()

