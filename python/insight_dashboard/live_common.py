from __future__ import annotations

import copy
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from .validation import validate_digest

BEIJING = ZoneInfo("Asia/Shanghai")
SCHEDULES = {"exam": "06:45", "news": "07:15", "market": "18:25"}


def now_beijing() -> datetime:
    return datetime.now(BEIJING)


def iso_now() -> str:
    return now_beijing().isoformat(timespec="seconds")


def content_hash(value: Any) -> str:
    payload = copy.deepcopy(value)
    if isinstance(payload, dict):
        payload.pop("content_hash", None)
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def record_base(record_id: str, date_value: str, source_ids: list[str] | None = None) -> dict[str, Any]:
    return {
        "schema_version": "1.0.0",
        "id": record_id,
        "date": date_value,
        "generated_at": iso_now(),
        "timezone": "Asia/Shanghai",
        "source_ids": source_ids or [],
        "content_hash": "pending",
        "generation_status": "success",
        "validation_errors": [],
    }


def seal(record: dict[str, Any]) -> dict[str, Any]:
    record["content_hash"] = content_hash(record)
    return record


def _load_base(root: Path, date_value: str) -> dict[str, Any]:
    year, month, _ = date_value.split("-")
    dated = root / "data" / "daily" / year / month / f"{date_value}.json"
    source = dated if dated.exists() else root / "data" / "manifests" / "latest.json"
    return json.loads(source.read_text(encoding="utf-8"))


def _render_daily_markdown(payload: dict[str, Any]) -> str:
    lines = [
        f"# {payload['title']}",
        "",
        "> **真实来源 / 自动整理**：仅根据公开来源生成索引和结构化学习材料；请以原文为准。A 股内容不构成投资建议。",
        "",
        payload["overview"],
        "",
        "## 新闻",
        "",
    ]
    for item in payload["news"]:
        lines.extend(
            [
                f"### {item['title']}",
                "",
                item["summary"],
                "",
                f"- 来源：[{item['source_name']}]({item['source_url']})",
                "",
            ]
        )
    lines.extend(
        [
            "## A 股",
            "",
            f"- 状态：{payload['market']['status_note']}",
            f"- 情绪：{payload['market']['sentiment']}",
            "",
            "## 行测",
            "",
        ]
    )
    lines.extend(
        f"{index}. {question['stem']}" for index, question in enumerate(payload["exam"]["questions"], 1)
    )
    lines.append("")
    return "\n".join(lines)


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _write_module(root: Path, date_value: str, module: str, value: Any) -> None:
    year, month, _ = date_value.split("-")
    base = root / "data" / module / year / month / date_value
    if module == "news":
        wrapper = record_base(
            f"news-daily-{date_value}",
            date_value,
            sorted({source for item in value["items"] for source in item["source_ids"]}),
        )
        wrapper.update({"items": value["items"], "deep_dives": value["deep_dives"]})
        seal(wrapper)
        markdown = "# 新闻与深度剖析\n\n" + "\n\n".join(
            f"## [{item['title']}]({item['source_url']})\n\n{item['summary']}" for item in value["items"]
        )
        markdown += f"\n\n# 深度剖析（{len(value['deep_dives'])} 条）\n\n" + "\n\n".join(
            "\n\n".join(
                [
                    f"## {deep['title']}",
                    deep["one_sentence"],
                    f"**背景**：{deep['background']}",
                    f"**传导机制**：{deep['mechanism']}",
                    f"**影响链**：{' → '.join(deep['impact_chain'])}",
                    f"**仍需核验**：{'；'.join(deep['unknowns'])}",
                ]
            )
            for deep in value["deep_dives"]
        )
        value = wrapper
    elif module == "market":
        markdown = f"# A 股收盘复盘\n\n- 日期：{value['trading_date']}\n- 状态：{value['status_note']}\n- 情绪：{value['sentiment']}\n"
    else:
        markdown = (
            "# 公考每日训练\n\n"
            + "\n".join(f"{index}. {item['stem']}" for index, item in enumerate(value["questions"], 1))
            + "\n"
        )
    _write_json(base.with_suffix(".json"), value)
    base.with_suffix(".md").write_text(markdown, encoding="utf-8")


def publish_module(
    root: Path,
    date_value: str,
    module: str,
    value: Any,
    *,
    dry_run: bool = False,
    base_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload = copy.deepcopy(base_payload) if base_payload is not None else _load_base(root, date_value)
    timestamp = iso_now()
    payload.update(
        {
            "id": f"daily-{date_value}",
            "date": date_value,
            "generated_at": timestamp,
            "title": f"{date_value} 每日研判与公考学习看板",
            "overview": "真实公开来源日报：8 条新闻索引、3 条逻辑链拆解、A 股风险复盘与 8 道原创公考练习。",
            "is_demo": False,
        }
    )
    if module == "news":
        payload["news"] = value["items"]
        payload["deep_dives"] = value["deep_dives"]
    else:
        payload[module] = value

    statuses = {item["module"]: item for item in payload["task_statuses"]}
    for name, status in statuses.items():
        if name != module and status["freshness"] != "demo" and str(status["last_run"])[:10] != date_value:
            status.update(
                {"status": "stale", "freshness": "stale", "message": "沿用上一期数据，等待本模块更新"}
            )
    module_messages = {
        "exam": "原创练习已生成并校验",
        "market": "公开行情已完成收盘复盘",
    }
    if module == "news":
        new_count = sum(item.get("freshness", "new") == "new" for item in value["items"])
        follow_up_count = len(value["items"]) - new_count
        deep_count = len(value["deep_dives"])
        module_messages["news"] = (
            f"本期新增 {new_count} 条，持续跟踪 {follow_up_count} 条，"
            f"其中 {deep_count} 条具备深度剖析证据；均来自官方公开来源"
        )
        payload["overview"] = (
            f"真实公开来源日报：本期新增 {new_count} 条、持续跟踪 {follow_up_count} 条，"
            f"并提供 {deep_count} 条有正文或官方摘要支撑的深度剖析；"
            "另含 A 股风险复盘与 8 道轮换原创练习。"
        )
    statuses[module] = {
        "module": module,
        "scheduled_time": SCHEDULES[module],
        "last_run": timestamp,
        "status": "success",
        "freshness": "fresh",
        "message": module_messages[module],
    }
    payload["task_statuses"] = [statuses[name] for name in ("exam", "news", "market")]
    all_fresh = all(
        item["freshness"] == "fresh" and str(item["last_run"])[:10] == date_value
        for item in payload["task_statuses"]
    )
    payload["generation_status"] = "success" if all_fresh else "partial"
    payload["source_ids"] = sorted(
        {source for item in payload["news"] for source in item["source_ids"]}
        | set(payload["market"]["source_ids"])
        | set(payload["exam"]["source_ids"])
    )
    seal(payload)
    validate_digest(payload)
    if dry_run:
        return payload

    year, month, _ = date_value.split("-")
    daily_path = root / "data" / "daily" / year / month / f"{date_value}.json"
    _write_json(daily_path, payload)
    daily_path.with_suffix(".md").write_text(_render_daily_markdown(payload), encoding="utf-8")
    _write_module(root, date_value, module, value)

    latest_path = root / "data" / "manifests" / "latest.json"
    latest = json.loads(latest_path.read_text(encoding="utf-8"))
    if date_value >= latest["date"]:
        _write_json(latest_path, payload)
        _write_json(root / "public" / "data" / "latest.json", payload)
    _write_json(root / "public" / "data" / "daily" / f"{date_value}.json", payload)

    archive_path = root / "data" / "manifests" / "archive-index.json"
    archive = json.loads(archive_path.read_text(encoding="utf-8"))
    entry = {
        "date": date_value,
        "title": payload["title"],
        "mode": "live",
        "news_count": len(payload["news"]),
        "deep_dive_count": len(payload["deep_dives"]),
        "question_count": len(payload["exam"]["questions"]),
        "market_status": payload["market"]["market_status"],
        "path": f"/daily/{date_value}/",
    }
    archive["entries"] = sorted(
        [item for item in archive["entries"] if item["date"] != date_value] + [entry],
        key=lambda item: item["date"],
        reverse=True,
    )
    archive["generated_at"] = timestamp
    _write_json(archive_path, archive)
    _write_json(root / "public" / "data" / "archive-index.json", archive)
    return payload
