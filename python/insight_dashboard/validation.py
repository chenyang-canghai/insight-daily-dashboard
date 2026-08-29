from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from .models import DailyDigest

FORBIDDEN_INVESTMENT_PHRASES = ("必涨", "稳赚", "百分百", "无风险", "内幕消息")
SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"(?i)(api[_-]?key|token|password)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}"),
)


def scan_text(value: str) -> list[str]:
    errors = [f"forbidden investment phrase: {phrase}" for phrase in FORBIDDEN_INVESTMENT_PHRASES if phrase in value]
    errors.extend("possible secret detected" for pattern in SECRET_PATTERNS if pattern.search(value))
    return errors


def validate_digest(payload: dict[str, Any], now: datetime | None = None) -> DailyDigest:
    digest = DailyDigest.model_validate(payload)
    errors = scan_text(digest.model_dump_json())
    current = now or datetime.now(tz=digest.generated_at.tzinfo)
    if digest.generated_at > current and not digest.is_demo:
        errors.append("generated_at is in the future")
    if len({item.id for item in digest.news}) != len(digest.news):
        errors.append("duplicate news id")
    if errors:
        raise ValueError("; ".join(errors))
    return digest
