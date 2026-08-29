from __future__ import annotations

import argparse


def main() -> int:
    parser = argparse.ArgumentParser(description="新闻采集入口（失败关闭）")
    parser.add_argument("--dry-run", action="store_true")
    parser.parse_args()
    print("No live source configured; collector exited without fabricating data.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
