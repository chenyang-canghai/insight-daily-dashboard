from __future__ import annotations

import argparse
import json
import os
from datetime import date
from pathlib import Path

from insight_dashboard.demo import load_demo
from insight_dashboard.live_common import publish_module
from insight_dashboard.live_exam import generate_exam
from insight_dashboard.live_market import generate_market
from insight_dashboard.live_news import generate_news

ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="生成或校验知势日报")
    parser.add_argument("--date", default=date.today().isoformat())
    parser.add_argument("--module", choices=["all", "news", "market", "exam"], default="all")
    parser.add_argument("--demo", action="store_true", help="使用仓库内 demo，不访问网络或 LLM")
    parser.add_argument("--dry-run", action="store_true", help="只校验，不写入文件")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    date.fromisoformat(args.date)
    if args.demo:
        payload = load_demo(ROOT, args.date)
        summary = {
            "status": "validated",
            "mode": "demo",
            "date": args.date,
            "module": args.module,
            "dry_run": args.dry_run,
            "news": len(payload["news"]),
            "questions": len(payload["exam"]["questions"]),
        }
        print(json.dumps(summary, ensure_ascii=False))
        return 0

    modules = ["exam", "news", "market"] if args.module == "all" else [args.module]
    diagnostics: dict[str, list[str]] = {}
    payload = None
    for module in modules:
        if module == "exam":
            value = generate_exam(args.date)
            failures: list[str] = []
        elif module == "news":
            lookback = int(os.environ.get("NEWS_LOOKBACK_DAYS", "7"))
            value, failures = generate_news(ROOT, args.date, lookback)
        else:
            value, failures = generate_market(args.date, os.environ.get("MARKET_PROVIDER", "akshare"))
        payload = publish_module(
            ROOT,
            args.date,
            module,
            value,
            dry_run=args.dry_run,
            base_payload=payload if args.dry_run else None,
        )
        diagnostics[module] = failures
    assert payload is not None
    summary = {
        "status": "validated" if args.dry_run else "published",
        "mode": "live",
        "date": args.date,
        "module": args.module,
        "dry_run": args.dry_run,
        "generation_status": payload["generation_status"],
        "news": len(payload["news"]),
        "news_new": sum(item.get("freshness", "new") == "new" for item in payload["news"]),
        "news_follow_up": sum(item.get("freshness") == "follow_up" for item in payload["news"]),
        "questions": len(payload["exam"]["questions"]),
        "diagnostics": diagnostics,
    }
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
