from __future__ import annotations

import re
from collections.abc import Iterable
from difflib import SequenceMatcher
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .models import NewsItem

TRACKING_KEYS = {"fbclid", "gclid", "spm", "from", "ref", "source"}


def canonicalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    query = [(key, value) for key, value in parse_qsl(parts.query) if not key.lower().startswith("utm_") and key.lower() not in TRACKING_KEYS]
    path = re.sub(r"/{2,}", "/", parts.path).rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, urlencode(sorted(query)), ""))


def normalized_title(title: str) -> str:
    return re.sub(r"[^\w\u4e00-\u9fff]", "", title.casefold())


def title_similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, normalized_title(left), normalized_title(right)).ratio()


def deduplicate(items: Iterable[NewsItem], threshold: float = 0.82) -> list[NewsItem]:
    kept: list[NewsItem] = []
    urls: set[str] = set()
    for item in sorted(items, key=lambda current: (current.importance_score, current.reliability == "A"), reverse=True):
        url = canonicalize_url(str(item.source_url))
        if url in urls:
            continue
        if any(title_similarity(item.title, other.title) >= threshold for other in kept):
            continue
        kept.append(item)
        urls.add(url)
    return kept


def importance_score(parts: dict[str, int]) -> int:
    limits = {"impact_scope": 20, "duration": 15, "policy_industry": 20, "china_relevance": 15, "market_impact": 15, "novelty": 10, "reliability": 5}
    unknown = set(parts) - set(limits)
    if unknown:
        raise ValueError(f"unknown score dimensions: {sorted(unknown)}")
    for key, limit in limits.items():
        value = parts.get(key, 0)
        if value < 0 or value > limit:
            raise ValueError(f"{key} must be between 0 and {limit}")
    return sum(parts.get(key, 0) for key in limits)
