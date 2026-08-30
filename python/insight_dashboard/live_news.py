from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import feedparser
import httpx
import yaml
from bs4 import BeautifulSoup

from .live_common import BEIJING, record_base, seal
from .news import canonicalize_url, title_similarity
from .news_analysis import build_analysis

USER_AGENT = "InsightDailyDashboard/1.0 (+https://github.com/chenyang-canghai/insight-daily-dashboard)"
DATE_PATTERN = re.compile(r"(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})日?")
TOPIC_RULES = {
    "人工智能": ("人工智能", "大模型", "算法", "智能化", "AI"),
    "半导体": ("半导体", "集成电路", "芯片", "晶圆"),
    "数字经济": ("数字经济", "数据要素", "公共数据", "数据局", "数字化"),
    "宏观经济": ("经济", "价格", "生产", "消费", "投资", "就业", "统计"),
    "国际时政": (
        "国际",
        "全球",
        "外贸",
        "外交",
        "中外",
        "对外",
        "中俄",
        "中阿",
        "欧盟",
        "美国",
        "俄罗斯",
        "约旦",
        "东盟",
        "非洲",
        "一带一路",
        "联合国",
        "会谈",
        "国事访问",
    ),
    "中国政策": ("政策", "意见", "通知", "办法", "条例", "发布会"),
}
SOURCE_TITLE_FILTERS = {
    "mohrss-news": (
        "人社",
        "就业",
        "招聘",
        "人才",
        "劳动",
        "工资",
        "养老",
        "社保",
        "社会保障",
        "职业",
        "技能",
        "工伤",
        "失业",
        "农民工",
        "高校毕业生",
    ),
    "mohrss-policy": (
        "人社",
        "就业",
        "人才",
        "劳动",
        "养老",
        "社保",
        "社会保障",
        "职业",
        "技能",
    ),
}


@dataclass(slots=True)
class RawArticle:
    source_id: str
    source_name: str
    source_url: str
    title: str
    url: str
    published_at: datetime
    priority: int
    topics: list[str]
    description: str = ""


@dataclass(slots=True)
class SelectedArticle:
    article: RawArticle
    freshness: str
    first_seen_date: str
    last_seen_date: str = ""
    appearance_count: int = 0


def _parse_date(text: str) -> datetime | None:
    match = DATE_PATTERN.search(text)
    if not match:
        return None
    parsed = date(*(int(value) for value in match.groups()))
    return datetime.combine(parsed, time(9), BEIJING)


def _source_relevant(article: RawArticle) -> bool:
    keywords = SOURCE_TITLE_FILTERS.get(article.source_id)
    return not keywords or any(keyword in article.title for keyword in keywords)


def _published(entry: Any) -> datetime | None:
    for key in ("published", "updated", "created"):
        value = entry.get(key)
        if not value:
            continue
        try:
            parsed = parsedate_to_datetime(value)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=BEIJING)
            return parsed.astimezone(BEIJING)
        except (TypeError, ValueError, OverflowError):
            candidate = _parse_date(str(value))
            if candidate:
                return candidate
    return _parse_date(str(entry))


def _fetch_rss(client: httpx.Client, source: dict[str, Any]) -> list[RawArticle]:
    response = client.get(source["url"])
    response.raise_for_status()
    parsed = feedparser.parse(response.content)
    if parsed.bozo and not parsed.entries:
        raise ValueError(f"invalid RSS: {parsed.bozo_exception}")
    results: list[RawArticle] = []
    for entry in parsed.entries:
        published = _published(entry)
        if not entry.get("title") or not entry.get("link") or published is None:
            continue
        results.append(
            RawArticle(
                source_id=source["id"],
                source_name=source["name"],
                source_url=source["url"],
                title=BeautifulSoup(str(entry.get("title", "")), "html.parser").get_text(" ", strip=True),
                url=urljoin(source["url"], str(entry.get("link", ""))),
                published_at=published,
                priority=int(source["priority"]),
                topics=list(source.get("topics", [])),
                description=" ".join(
                    BeautifulSoup(
                        str(entry.get("summary") or entry.get("description") or ""),
                        "html.parser",
                    )
                    .get_text(" ", strip=True)
                    .split()
                ),
            )
        )
    return results


def _fetch_html(client: httpx.Client, source: dict[str, Any]) -> list[RawArticle]:
    response = client.get(source["url"])
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    results: list[RawArticle] = []
    for anchor in soup.select("a[href]"):
        title = " ".join(anchor.get_text(" ", strip=True).split())
        if len(title) < 8 or title in {"更多", "查看详情"}:
            continue
        href = urljoin(source["url"], str(anchor.get("href")))
        if not href.startswith(("http://", "https://")):
            continue
        published = None
        container = anchor.parent
        for _ in range(3):
            if container is None:
                break
            context = container.get_text(" ", strip=True)
            if len(context) <= 500:
                published = _parse_date(context)
            if published is not None:
                break
            container = container.parent
        if published is None:
            continue
        results.append(
            RawArticle(
                source["id"],
                source["name"],
                source["url"],
                title,
                href,
                published,
                int(source["priority"]),
                list(source.get("topics", [])),
            )
        )
    return results


def collect_articles(
    root: Path, target_date: date, lookback_days: int = 7
) -> tuple[list[RawArticle], list[str]]:
    registry = yaml.safe_load((root / "data" / "source-registry" / "sources.yml").read_text(encoding="utf-8"))
    sources = [
        source
        for source in registry["sources"]
        if source.get("enabled") and source["type"] in {"official_rss", "official_html_list"}
    ]
    failures: list[str] = []
    articles: list[RawArticle] = []
    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=20, follow_redirects=True) as client:
        for source in sources:
            try:
                fetcher = _fetch_rss if source["type"] == "official_rss" else _fetch_html
                articles.extend(fetcher(client, source))
            except Exception as exc:
                failures.append(f"{source['id']}: {type(exc).__name__}: {exc}")
    earliest = target_date - timedelta(days=lookback_days)
    return [
        item
        for item in articles
        if earliest <= item.published_at.date() <= target_date and _source_relevant(item)
    ], failures


def _category(article: RawArticle) -> str:
    title_lower = article.title.lower()
    for topic in ("人工智能", "半导体", "国际时政", "数字经济"):
        if any(keyword.lower() in title_lower for keyword in TOPIC_RULES[topic]):
            return topic
    haystack = article.title + " " + article.description[:500] + " " + " ".join(article.topics)
    matches = [
        (topic, sum(keyword.lower() in haystack.lower() for keyword in keywords))
        for topic, keywords in TOPIC_RULES.items()
    ]
    topic, score = max(matches, key=lambda item: item[1])
    return topic if score else (article.topics[0] if article.topics else "中国政策")


def _excerpt(value: str, limit: int = 260) -> str:
    compact = " ".join(value.split())
    search_end = min(len(compact), limit)
    boundaries = [compact.find(mark, 20, search_end) for mark in ("。", "！", "？", ";", "；")]
    boundary = (
        min(position for position in boundaries if position >= 20)
        if any(position >= 20 for position in boundaries)
        else -1
    )
    if boundary >= 20:
        return compact[: boundary + 1].rstrip()
    if len(compact) <= limit:
        return compact
    return compact[:limit].rstrip() + "……"


def _load_recent_history(root: Path, target_date: date, history_days: int = 14) -> list[dict[str, Any]]:
    history: list[dict[str, Any]] = []
    for offset in range(history_days, 0, -1):
        history_date = target_date - timedelta(days=offset)
        path = (
            root
            / "data"
            / "news"
            / f"{history_date.year:04d}"
            / f"{history_date.month:02d}"
            / f"{history_date.isoformat()}.json"
        )
        if not path.exists():
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        history.extend(payload.get("items", []))
    return history


def _history_match(article: RawArticle, history: list[dict[str, Any]]) -> tuple[str, str, int] | None:
    article_url = canonicalize_url(article.url)
    matched_dates: list[str] = []
    for item in history:
        prior_url = item.get("source_url")
        prior_title = str(item.get("title", ""))
        same_url = bool(prior_url and canonicalize_url(str(prior_url)) == article_url)
        same_title = bool(prior_title and title_similarity(article.title, prior_title) >= 0.9)
        if same_url or same_title:
            matched_dates.append(str(item.get("date")))
            matched_dates.append(str(item.get("first_seen_date") or item.get("date")))
    dates = [value for value in matched_dates if value and value != "None"]
    if not dates:
        return None
    seen_dates = sorted(set(dates))
    return seen_dates[0], seen_dates[-1], len(seen_dates)


def _source_diverse(items: list[SelectedArticle]) -> list[SelectedArticle]:
    ordered: list[SelectedArticle] = []
    used_sources: set[str] = set()
    for item in items:
        if item.article.source_id not in used_sources:
            ordered.append(item)
            used_sources.add(item.article.source_id)
    ordered.extend(item for item in items if item not in ordered)
    return ordered


def _select(
    articles: list[RawArticle], count: int, history: list[dict[str, Any]] | None = None
) -> list[SelectedArticle]:
    unique: list[RawArticle] = []
    urls: set[str] = set()
    for article in sorted(articles, key=lambda item: (item.published_at, -item.priority), reverse=True):
        url = canonicalize_url(article.url)
        if url in urls or any(title_similarity(article.title, kept.title) >= 0.88 for kept in unique):
            continue
        unique.append(article)
        urls.add(url)

    new_items: list[SelectedArticle] = []
    follow_ups: list[SelectedArticle] = []
    for article in unique:
        match = _history_match(article, history or [])
        selected = SelectedArticle(
            article,
            "follow_up" if match else "new",
            match[0] if match else "",
            match[1] if match else "",
            match[2] if match else 0,
        )
        (follow_ups if match else new_items).append(selected)
    for selected in new_items:
        selected.first_seen_date = selected.first_seen_date or "pending"

    follow_ups.sort(
        key=lambda item: (
            item.last_seen_date,
            item.appearance_count,
            -item.article.published_at.timestamp(),
        )
    )

    ordered = _source_diverse(new_items) + _source_diverse(follow_ups)
    return ordered[:count]


def build_news(
    articles: list[RawArticle],
    date_value: str,
    history: list[dict[str, Any]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    selected = _select(articles, 8, history)
    if len(selected) < 8:
        raise ValueError(f"真实来源去重后仅 {len(selected)} 条，少于要求的 8 条；拒绝生成")
    generated_at = datetime.now(BEIJING).isoformat(timespec="seconds")
    items: list[dict[str, Any]] = []
    for index, selected_article in enumerate(selected, 1):
        article = selected_article.article
        category = _category(article)
        analysis = build_analysis(f"{article.title} {article.description[:300]}", category)
        first_seen_date = (
            date_value if selected_article.freshness == "new" else selected_article.first_seen_date
        )
        freshness_note = (
            "本期首次收录。"
            if selected_article.freshness == "new"
            else f"该条目最早于 {first_seen_date} 收录；本期新增来源不足时作为持续跟踪项保留。"
        )
        citation = {
            "source_id": article.source_id,
            "source_name": article.source_name,
            "url": article.url,
            "title": article.title,
            "published_at": article.published_at.isoformat(),
            "note": "官方公开列表或 RSS 元数据；正文事实与完整语境请查阅原文。",
        }
        evidence_excerpt = _excerpt(article.description)
        summary = (
            f"发生了什么：{article.source_name}于 {article.published_at:%Y-%m-%d} 公开《{article.title}》。"
            + (
                f"官方 RSS 摘要显示：{evidence_excerpt}"
                if evidence_excerpt
                else "目前可确认的是标题、来源和发布时间，正文细节仍需回到原文核对。"
            )
            + freshness_note
        )
        facts = [f"{article.source_name}的公开页面列出了题为《{article.title}》的条目。"]
        if evidence_excerpt:
            facts.append(f"该官方 RSS 摘要写明：{evidence_excerpt}")
        item = record_base(f"news-{date_value}-{index:02d}", date_value, [article.source_id])
        item.update(
            {
                "generated_at": generated_at,
                "title": article.title,
                "category": category,
                "regions": ["中国"],
                "published_at": article.published_at.isoformat(),
                "collected_at": generated_at,
                "source_name": article.source_name,
                "source_url": article.url,
                "summary": summary,
                "why_it_matters": f"{analysis['focus']} 对“{category}”而言，接下来重点观察{analysis['watch']}。",
                "importance_score": max(60, 92 - article.priority - index),
                "reliability": "A",
                "tags": [
                    category,
                    "本期新增" if selected_article.freshness == "new" else "持续跟踪",
                    "官方来源",
                    "元数据索引",
                ],
                "facts": facts,
                "inferences": [
                    f"分析框架认为应关注{analysis['watch']}；这是待核验的观察方向，不是已经发生的效果。"
                ],
                "citations": [citation],
                "related_items": [],
                "reading_minutes": 4,
                "is_demo": False,
                "freshness": selected_article.freshness,
                "first_seen_date": first_seen_date,
            }
        )
        items.append(seal(item))

    deep_dive_items: list[dict[str, Any]] = []
    used_categories: set[str] = set()
    for item in items:
        if item["category"] not in used_categories:
            deep_dive_items.append(item)
            used_categories.add(item["category"])
        if len(deep_dive_items) == 3:
            break
    deep_dive_items.extend(item for item in items if item not in deep_dive_items)

    deep_dives: list[dict[str, Any]] = []
    for index, item in enumerate(deep_dive_items[:3], 1):
        analysis = build_analysis(item["title"], item["category"])
        deep = record_base(f"deep-{date_value}-{index}", date_value, item["source_ids"])
        deep.update(
            {
                "generated_at": generated_at,
                "news_ids": [item["id"]],
                "title": f"逻辑拆解｜{item['title']}",
                "one_sentence": f"对《{item['title']}》，{analysis['focus']}",
                "background": f"读懂这条信息可以分三层：第一层确认谁在何时发布了什么；第二层按“{analysis['check']}”核对正文；第三层再观察“{analysis['watch']}”。这样能把事实、解释和判断分开。",
                "timeline": [
                    {"time": item["published_at"][:10], "label": "官方页面发布该条目", "status": "confirmed"},
                    {"time": "当前", "label": analysis["check"], "status": "context"},
                    {"time": "后续", "label": f"持续观察{analysis['watch']}", "status": "watch"},
                ],
                "stakeholders": analysis["stakeholders"],
                "mechanism": analysis["mechanism"],
                "impact_chain": analysis["impact_chain"],
                "beneficiaries": analysis["beneficiaries"],
                "pressured_groups": analysis["pressured_groups"],
                "short_term": analysis["check"],
                "medium_term": analysis["medium_term"],
                "long_term": analysis["long_term"],
                "unknowns": analysis["unknowns"],
                "confidence": "中",
                "student_insights": [
                    "先写清已确认的发布事实，不把标题扩写成正文",
                    f"再用“{analysis['impact_chain'][0]}—{analysis['impact_chain'][-1]}”解释可能的传导机制",
                    f"最后用“{analysis['watch']}”设计后续验证指标",
                ],
                "shenlun_material": {
                    "theme": item["category"],
                    "expressions": analysis["expressions"],
                    "case": f"可把{item['source_name']}发布的《{item['title']}》作为议题线索；作答时只引用已核验的对象、做法和数据，不把分析框架当成现实成效。",
                    "argument": analysis["argument"],
                },
                "citations": item["citations"],
                "is_demo": False,
            }
        )
        deep_dives.append(seal(deep))
    return {"items": items, "deep_dives": deep_dives}


def generate_news(root: Path, date_value: str, lookback_days: int = 7) -> tuple[dict[str, Any], list[str]]:
    articles, failures = collect_articles(root, date.fromisoformat(date_value), lookback_days)
    history = _load_recent_history(root, date.fromisoformat(date_value))
    return build_news(articles, date_value, history), failures
