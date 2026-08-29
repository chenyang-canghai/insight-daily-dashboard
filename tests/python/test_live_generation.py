from datetime import datetime, timedelta
from pathlib import Path

from insight_dashboard.live_common import BEIJING, publish_module
from insight_dashboard.live_exam import generate_exam
from insight_dashboard.live_news import RawArticle, build_news
from insight_dashboard.validation import validate_digest

ROOT = Path(__file__).resolve().parents[2]


def test_live_news_is_source_bounded() -> None:
    published = datetime(2026, 8, 29, 7, tzinfo=BEIJING)
    titles = [
        "宏观经济运行数据发布",
        "人工智能治理规则解读",
        "半导体产业创新政策",
        "公共数据授权运营指南",
        "青年就业服务专项行动",
        "绿色制造体系建设通知",
        "营商环境改革重点任务",
        "基层治理能力提升方案",
        "乡村振兴产业融合案例",
        "数字政府标准体系更新",
    ]
    articles = [
        RawArticle(
            source_id=f"official-{index % 4}",
            source_name=f"官方来源 {index % 4}",
            source_url="https://example.gov.cn/list/",
            title=titles[index],
            url=f"https://example.gov.cn/item/{index}",
            published_at=published - timedelta(hours=index),
            priority=5 + index % 4,
            topics=["数字经济", "中国政策"],
        )
        for index in range(10)
    ]
    result = build_news(articles, "2026-08-29")
    assert len(result["items"]) == 8
    assert len(result["deep_dives"]) == 3
    assert all(not item["is_demo"] and item["citations"] for item in result["items"])
    assert all("以原文为准" in item["summary"] for item in result["items"])


def test_live_exam_and_dry_run_digest_validate_without_writes() -> None:
    exam = generate_exam("2026-08-29")
    before = (ROOT / "data" / "manifests" / "latest.json").read_bytes()
    payload = publish_module(ROOT, "2026-08-29", "exam", exam, dry_run=True)
    assert len(exam["questions"]) == 8
    assert all(item["source_type"] == "original" and not item["is_demo"] for item in exam["questions"])
    assert validate_digest(payload).generation_status == "partial"
    assert (ROOT / "data" / "manifests" / "latest.json").read_bytes() == before
