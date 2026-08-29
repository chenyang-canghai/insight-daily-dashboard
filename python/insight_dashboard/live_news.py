from __future__ import annotations

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

USER_AGENT = "InsightDailyDashboard/1.0 (+https://github.com/chenyang-canghai/insight-daily-dashboard)"
DATE_PATTERN = re.compile(r"(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})日?")
TOPIC_RULES = {
    "人工智能": ("人工智能", "大模型", "算法", "智能化", "AI"),
    "半导体": ("半导体", "集成电路", "芯片", "晶圆"),
    "数字经济": ("数字经济", "数据要素", "公共数据", "数据局", "数字化"),
    "宏观经济": ("经济", "价格", "生产", "消费", "投资", "就业", "统计"),
    "国际时政": ("国际", "全球", "外贸", "欧盟", "美国", "联合国"),
    "中国政策": ("政策", "意见", "通知", "办法", "条例", "发布会"),
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


def _parse_date(text: str) -> datetime | None:
    match = DATE_PATTERN.search(text)
    if not match:
        return None
    parsed = date(*(int(value) for value in match.groups()))
    return datetime.combine(parsed, time(9), BEIJING)


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
            RawArticle(source["id"], source["name"], source["url"], title, href, published, int(source["priority"]), list(source.get("topics", [])))
        )
    return results


def collect_articles(root: Path, target_date: date, lookback_days: int = 7) -> tuple[list[RawArticle], list[str]]:
    registry = yaml.safe_load((root / "data" / "source-registry" / "sources.yml").read_text(encoding="utf-8"))
    sources = [source for source in registry["sources"] if source.get("enabled") and source["type"] in {"official_rss", "official_html_list"}]
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
    return [item for item in articles if earliest <= item.published_at.date() <= target_date], failures


def _category(article: RawArticle) -> str:
    haystack = article.title + " " + " ".join(article.topics)
    matches = [(topic, sum(keyword.lower() in haystack.lower() for keyword in keywords)) for topic, keywords in TOPIC_RULES.items()]
    topic, score = max(matches, key=lambda item: item[1])
    return topic if score else (article.topics[0] if article.topics else "中国政策")


def _select(articles: list[RawArticle], count: int) -> list[RawArticle]:
    unique: list[RawArticle] = []
    urls: set[str] = set()
    for article in sorted(articles, key=lambda item: (item.published_at, -item.priority), reverse=True):
        url = canonicalize_url(article.url)
        if url in urls or any(title_similarity(article.title, kept.title) >= 0.88 for kept in unique):
            continue
        unique.append(article)
        urls.add(url)
    selected: list[RawArticle] = []
    used_sources: set[str] = set()
    for article in unique:
        if article.source_id not in used_sources:
            selected.append(article)
            used_sources.add(article.source_id)
        if len(selected) == count:
            return selected
    for article in unique:
        if article not in selected:
            selected.append(article)
        if len(selected) == count:
            break
    return selected


def build_news(articles: list[RawArticle], date_value: str) -> dict[str, list[dict[str, Any]]]:
    selected = _select(articles, 8)
    if len(selected) < 8:
        raise ValueError(f"真实来源去重后仅 {len(selected)} 条，少于要求的 8 条；拒绝生成")
    generated_at = datetime.now(BEIJING).isoformat(timespec="seconds")
    items: list[dict[str, Any]] = []
    for index, article in enumerate(selected, 1):
        category = _category(article)
        citation = {
            "source_id": article.source_id,
            "source_name": article.source_name,
            "url": article.url,
            "title": article.title,
            "published_at": article.published_at.isoformat(),
            "note": "官方公开列表或 RSS 元数据；正文事实与完整语境请查阅原文。",
        }
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
                "summary": f"{article.source_name}于 {article.published_at:%Y-%m-%d} 发布《{article.title}》。本卡片仅据公开标题与元数据建立索引，不补写原文未核验的事实，具体内容以原文为准。",
                "why_it_matters": f"该条目与“{category}”相关，可用于跟踪政策信号、执行口径和后续数据，但不能仅凭标题得出成效判断。",
                "importance_score": max(60, 92 - article.priority - index),
                "reliability": "A",
                "tags": [category, "官方来源", "元数据索引"],
                "facts": [f"{article.source_name}的公开页面列出了题为《{article.title}》的条目。"],
                "inferences": ["标题显示其可能与所标注主题相关；影响范围、实施效果与因果关系需阅读原文并结合后续数据核验。"],
                "citations": [citation],
                "related_items": [],
                "reading_minutes": 3,
                "is_demo": False,
            }
        )
        items.append(seal(item))

    deep_dives: list[dict[str, Any]] = []
    for index, item in enumerate(items[:3], 1):
        deep = record_base(f"deep-{date_value}-{index}", date_value, item["source_ids"])
        deep.update(
            {
                "generated_at": generated_at,
                "news_ids": [item["id"]],
                "title": f"研读框架｜{item['title']}",
                "one_sentence": "先核对原文中的政策对象、工具和时间边界，再用执行指标检验标题所代表的信号。",
                "background": "本分析只提供阅读框架，不代替原文，也不把标题扩写成未经证实的事实。",
                "timeline": [
                    {"time": item["published_at"][:10], "label": "官方页面发布该条目", "status": "confirmed"},
                    {"time": "当前", "label": "核对原文的对象、范围、工具与口径", "status": "context"},
                    {"time": "后续", "label": "观察配套文件、执行进度与结果指标", "status": "watch"},
                ],
                "stakeholders": ["政策制定与执行部门", "相关市场主体", "公共服务对象", "研究与监督机构"],
                "mechanism": "政策或信息信号先改变规则与预期，再通过主体响应影响资源配置；是否产生实际成效，需要执行数据和结果数据验证。",
                "impact_chain": ["官方信息发布", "主体理解与预期调整", "执行行为变化", "投入与产出变化", "公共价值或产业结果"],
                "beneficiaries": ["能准确理解规则并完成合规调整的主体", "获得更清晰公共服务信息的群体"],
                "pressured_groups": ["信息获取和合规能力较弱的主体", "依赖模糊口径或短期预期的主体"],
                "short_term": "确认原文发布主体、适用范围、时间和关键动词。",
                "medium_term": "跟踪配套制度、预算、项目、企业响应和服务流程变化。",
                "long_term": "以效率、就业、创新、民生或治理结果检验长期效果。",
                "unknowns": ["原文细节尚未在本卡片中全文解析", "执行尺度与地区差异未知", "尚无结果数据支持因果判断"],
                "confidence": "中",
                "student_insights": ["区分已确认发布事实与机制推断", "把政策语言转成可观察指标", "申论中坚持问题、原因、对策和评价闭环"],
                "shenlun_material": {
                    "theme": item["category"],
                    "expressions": ["坚持目标导向和问题导向相统一", "健全执行、反馈与评估闭环", "以可核验结果提升治理效能"],
                    "case": "可将该官方条目作为线索；正式作答前须阅读原文，补齐时间、对象、做法与成效。",
                    "argument": "政策价值不仅在于发布，更在于形成权责清晰、执行有力、反馈及时的闭环。",
                },
                "citations": item["citations"],
                "is_demo": False,
            }
        )
        deep_dives.append(seal(deep))
    return {"items": items, "deep_dives": deep_dives}


def generate_news(root: Path, date_value: str, lookback_days: int = 7) -> tuple[dict[str, Any], list[str]]:
    articles, failures = collect_articles(root, date.fromisoformat(date_value), lookback_days)
    return build_news(articles, date_value), failures
