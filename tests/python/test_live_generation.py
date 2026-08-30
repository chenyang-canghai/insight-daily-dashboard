from datetime import datetime, timedelta
from pathlib import Path

from insight_dashboard.live_common import BEIJING, publish_module
from insight_dashboard.live_exam import generate_exam
from insight_dashboard.live_news import RawArticle, _excerpt, _parse_date, _source_relevant, build_news
from insight_dashboard.validation import validate_digest

ROOT = Path(__file__).resolve().parents[2]


def test_undated_list_navigation_is_not_assigned_today() -> None:
    assert _parse_date("数据出境安全评估") is None


def test_source_topic_filter_rejects_cross_channel_reposts() -> None:
    base = {
        "source_id": "mohrss-news",
        "source_name": "人力资源社会保障部-新闻",
        "source_url": "https://example.gov.cn/list/",
        "url": "https://example.gov.cn/item/1",
        "published_at": datetime(2026, 8, 30, 7, tzinfo=BEIJING),
        "priority": 8,
        "topics": ["青年就业", "中国政策"],
    }
    assert _source_relevant(RawArticle(title="青年就业服务专项行动", **base))
    assert not _source_relevant(RawArticle(title="外国领导人举行会谈", **base))


def test_rss_excerpt_stops_before_table_like_tail() -> None:
    sentence = "监测显示，本期33种产品价格上涨，14种下降，3种持平。"
    assert _excerpt(sentence + " 产品名称单位本期价格" * 30) == sentence
    assert _excerpt(sentence + " 产品名称单位本期价格" * 3) == sentence


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
    assert all("正文细节仍需回到原文核对" in item["summary"] for item in result["items"])
    assert all(
        item["freshness"] == "new" and item["first_seen_date"] == "2026-08-29" for item in result["items"]
    )
    assert len({item["one_sentence"] for item in result["deep_dives"]}) == 3
    assert all(
        "第一层" in item["background"] and len(item["impact_chain"]) >= 5 for item in result["deep_dives"]
    )


def test_live_news_prioritizes_new_items_and_labels_follow_ups() -> None:
    published = datetime(2026, 8, 30, 7, tzinfo=BEIJING)
    titles = [
        "数字经济政策与应用进展",
        "人工智能治理规则公开",
        "半导体产业创新支持方案",
        "公共数据授权运营指引",
        "青年就业服务专项行动",
        "绿色制造体系建设通知",
        "营商环境改革重点任务",
        "基层治理能力提升方案",
        "乡村产业融合发展案例",
        "数字政府标准体系更新",
    ]
    articles = [
        RawArticle(
            source_id=f"official-{index % 4}",
            source_name=f"官方来源 {index % 4}",
            source_url="https://example.gov.cn/list/",
            title=titles[index],
            url=f"https://example.gov.cn/item/{index}",
            published_at=published - timedelta(minutes=index),
            priority=5 + index % 4,
            topics=["数字经济", "中国政策"],
        )
        for index in range(10)
    ]
    history = [
        {
            "date": "2026-08-29",
            "first_seen_date": "2026-08-28",
            "title": articles[index].title,
            "source_url": articles[index].url,
        }
        for index in range(3)
    ]
    result = build_news(articles, "2026-08-30", history)
    assert [item["freshness"] for item in result["items"][:7]] == ["new"] * 7
    assert result["items"][-1]["freshness"] == "follow_up"
    assert result["items"][-1]["first_seen_date"] == "2026-08-28"
    assert "持续跟踪" in result["items"][-1]["tags"]


def test_live_news_rotates_follow_ups_by_oldest_last_seen_date() -> None:
    published = datetime(2026, 8, 30, 7, tzinfo=BEIJING)
    titles = [
        "宏观经济运行情况发布",
        "人工智能安全治理规则",
        "半导体产业创新行动",
        "公共数据授权运营指引",
        "青年就业服务专项行动",
        "绿色制造体系建设通知",
        "营商环境改革重点任务",
        "基层治理能力提升方案",
        "乡村产业融合发展案例",
        "数字政府标准体系更新",
    ]
    articles = [
        RawArticle(
            source_id=f"official-{index % 4}",
            source_name=f"官方来源 {index % 4}",
            source_url="https://example.gov.cn/list/",
            title=titles[index],
            url=f"https://example.gov.cn/follow/{index}",
            published_at=published - timedelta(minutes=index),
            priority=5,
            topics=["中国政策"],
        )
        for index in range(10)
    ]
    history = [
        {
            "date": "2026-08-29" if index < 8 else "2026-08-27",
            "title": article.title,
            "source_url": article.url,
        }
        for index, article in enumerate(articles)
    ]
    result = build_news(articles, "2026-08-30", history)
    selected_urls = [item["source_url"] for item in result["items"]]
    assert articles[8].url in selected_urls
    assert articles[9].url in selected_urls


def test_live_exam_and_dry_run_digest_validate_without_writes() -> None:
    exam = generate_exam("2026-08-29")
    before = (ROOT / "data" / "manifests" / "latest.json").read_bytes()
    payload = publish_module(ROOT, "2026-08-29", "exam", exam, dry_run=True)
    assert len(exam["questions"]) == 8
    assert all(item["source_type"] == "original" and not item["is_demo"] for item in exam["questions"])
    assert validate_digest(payload).generation_status in {"partial", "success"}
    assert (ROOT / "data" / "manifests" / "latest.json").read_bytes() == before


def test_live_exam_rotates_all_question_stems_across_four_days() -> None:
    exams = [generate_exam(f"2026-08-{day:02d}") for day in range(27, 31)]
    stems = [{question["stem"] for question in exam["questions"]} for exam in exams]
    assert all(len(current) == 8 for current in stems)
    for index, current in enumerate(stems):
        for previous in stems[:index]:
            assert current.isdisjoint(previous)
