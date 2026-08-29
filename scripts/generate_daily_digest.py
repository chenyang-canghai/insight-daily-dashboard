from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

from insight_dashboard.demo import load_demo
from insight_dashboard.market import is_a_share_trading_day

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
    if not args.demo:
        raise SystemExit("实时生成需要单独配置来源；首版请使用 --demo，禁止在证据不足时伪造内容。")
    payload = load_demo(ROOT, args.date)
    if args.module == "market":
        requested = date.fromisoformat(args.date)
        if not is_a_share_trading_day(requested):
            print(json.dumps({"status": "closed", "date": args.date, "message": "非交易日，不生成当日行情"}, ensure_ascii=False))
            return 0
    summary = {"status": "validated", "mode": "demo", "date": args.date, "module": args.module, "dry_run": args.dry_run, "news": len(payload["news"]), "questions": len(payload["exam"]["questions"])}
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
