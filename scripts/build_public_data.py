from __future__ import annotations

import json
import shutil
from pathlib import Path

from insight_dashboard.validation import validate_digest

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    latest = ROOT / "data" / "manifests" / "latest.json"
    payload = json.loads(latest.read_text(encoding="utf-8"))
    validate_digest(payload)
    target = ROOT / "public" / "data" / "latest.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(latest, target)
    print(f"validated and copied {latest.relative_to(ROOT)} -> {target.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
