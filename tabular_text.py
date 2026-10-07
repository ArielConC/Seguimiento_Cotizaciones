from __future__ import annotations

import csv
import io


def tab_delimited_rows(content: bytes) -> list[list[str]]:
    """Read Compact tab-delimited exports in UTF-8 or Windows-1252."""
    if not content:
        raise ValueError("The TXT file is empty")
    if b"\x00" in content:
        raise ValueError("The TXT file contains unsupported binary data")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = content.decode("cp1252")
        except UnicodeDecodeError as exc:
            raise ValueError("The TXT file encoding is not supported") from exc
    try:
        return [[cell.strip() for cell in row] for row in csv.reader(io.StringIO(text), delimiter="\t")]
    except csv.Error as exc:
        raise ValueError("The tab-delimited TXT file could not be read") from exc
