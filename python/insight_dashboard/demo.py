from __future__ import annotations

import json
from pathlib import Path

from .validation import validate_digest


def load_demo(root: Path, date_value: str) -> dict:
    year, month, _ = date_value.split("-")
    path = root / "data" / "daily" / year / month / f"{date_value}.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    validate_digest(payload)
    return payload
