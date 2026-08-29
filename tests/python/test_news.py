import json
from pathlib import Path

import pytest

from insight_dashboard.models import NewsItem
from insight_dashboard.news import canonicalize_url, deduplicate, importance_score, title_similarity

ROOT = Path(__file__).resolve().parents[2]


def sample() -> NewsItem:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))["news"][0]
    return NewsItem.model_validate(payload)


def test_url_canonicalization_removes_tracking() -> None:
    assert canonicalize_url("HTTPS://Example.COM/a/?utm_source=x&b=2") == "https://example.com/a?b=2"


def test_title_similarity_ignores_punctuation() -> None:
    assert title_similarity("数据要素：制度条件", "数据要素 制度条件") == 1


def test_deduplicator_keeps_one_event() -> None:
    item = sample()
    duplicate = item.model_copy(update={"id": "duplicate", "title": item.title + "！"})
    assert len(deduplicate([item, duplicate])) == 1


def test_importance_score_validates_dimensions() -> None:
    assert importance_score({"impact_scope": 20, "duration": 15, "policy_industry": 20, "china_relevance": 15, "market_impact": 15, "novelty": 10, "reliability": 5}) == 100
    with pytest.raises(ValueError):
        importance_score({"impact_scope": 21})
