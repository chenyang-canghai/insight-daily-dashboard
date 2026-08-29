import json
from pathlib import Path

import pytest

from insight_dashboard.validation import scan_text, validate_digest

ROOT = Path(__file__).resolve().parents[2]


def test_latest_json_contract() -> None:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))
    assert validate_digest(payload).is_demo


def test_forbidden_investment_language_and_secret_scan() -> None:
    assert scan_text("这只股票必涨")
    assert scan_text("api_key=abcdefghijklmnop1234")


def test_duplicate_news_is_rejected() -> None:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))
    payload["news"].append(payload["news"][0])
    with pytest.raises(ValueError, match="duplicate news id"):
        validate_digest(payload)
