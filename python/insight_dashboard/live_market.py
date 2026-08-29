from __future__ import annotations

import math
from datetime import date, datetime, time
from typing import Any

from .live_common import BEIJING, record_base, seal

INDEX_NAMES = {
    "000001": "上证指数",
    "399001": "深证成指",
    "399006": "创业板指",
    "000300": "沪深300",
    "000905": "中证500",
    "000688": "科创50",
}


def _number(value: Any) -> float | None:
    try:
        number = float(value)
        return None if math.isnan(number) or math.isinf(number) else number
    except (TypeError, ValueError):
        return None


def _point(value: float | None, unit: str, source: str, at: datetime, *, estimated: bool = False, note: str | None = None) -> dict[str, Any]:
    return {
        "value": value,
        "unit": unit,
        "source": source,
        "data_time": at.isoformat(),
        "adjusted": False,
        "realtime": False,
        "estimated": estimated,
        "missing": value is None,
        "note": note,
    }


def _citation(source_id: str, source_name: str, url: str, title: str, note: str) -> dict[str, Any]:
    return {"source_id": source_id, "source_name": source_name, "url": url, "title": title, "published_at": None, "note": note}


def _empty_candidate(date_value: str, citation: dict[str, Any]) -> dict[str, Any]:
    return {
        "code": "000000",
        "name": "本期不选股",
        "industry": "A 股全市场",
        "selected": False,
        "no_selection_reason": "免费公开数据不足以完成财务、估值与公告口径的双源验证。",
        "score": None,
        "score_breakdown": {},
        "business_model": "未选择具体公司，不作未经核验的商业模式概括。",
        "selection_reason": "坚持基本面与证据优先；仅有价格和板块热度时不形成个股判断。",
        "fundamentals": {"状态": "未完成权威财报与公告双源核验"},
        "valuation": {"状态": "未完成同口径估值与历史分位核验"},
        "technical_snapshot": {"状态": "不以短线技术信号替代基本面"},
        "catalysts": [],
        "risks": ["行情聚合接口可能延迟或变更", "单日涨跌不能证明行业景气", "缺少财务与公告交叉验证", "不构成投资建议"],
        "scenarios": {"optimistic": "待基本面与估值证据齐备后再定义。", "base": "保持观察，不选择标的。", "pessimistic": "数据质量下降或口径冲突时停止判断。"},
        "invalidation_conditions": ["上游数据时间与目标交易日不一致", "关键字段缺失或来源冲突", "无法核验公告与财务口径"],
        "conclusion": "数据不足，暂不判断",
        "data_as_of": date_value,
        "citations": [citation],
        "is_demo": False,
    }


def _closed_market(date_value: str, note: str) -> dict[str, Any]:
    at = datetime.combine(date.fromisoformat(date_value), time(18, 25), BEIJING)
    citation = _citation("akshare", "AKShare", "https://akshare.akfamily.xyz/", "AKShare 数据接口文档", "交易日历仅用于确认开闭市；非交易日不生成行情数值。")
    market = record_base(f"market-{date_value}", date_value, ["akshare"])
    market.update(
        {
            "trading_date": date_value,
            "market_status": "closed",
            "status_note": note,
            "indices": [],
            "market_breadth": {"up": None, "down": None, "flat": None, "limit_up": None, "limit_down": None, "median_change_pct": None},
            "turnover": _point(None, "亿元", "AKShare", at, note="非交易日，无收盘成交额"),
            "sentiment": "中性",
            "sentiment_basis": ["非交易日不根据缺失行情判断市场情绪"],
            "sectors": [],
            "research_candidate": _empty_candidate(date_value, citation),
            "data_quality": {"status": "unavailable", "completeness": 0, "conflicts": [], "notes": ["非交易日未采集行情"]},
            "sources": [citation],
            "is_demo": False,
        }
    )
    return seal(market)


def _trade_dates(ak: Any) -> set[date]:
    frame = ak.tool_trade_date_hist_sina()
    if "trade_date" not in frame.columns:
        raise ValueError("AKShare 交易日历缺少 trade_date 列")
    return {value.date() if hasattr(value, "date") else date.fromisoformat(str(value)[:10]) for value in frame["trade_date"]}


def _akshare_market(date_value: str) -> dict[str, Any]:
    import akshare as ak

    target = date.fromisoformat(date_value)
    dates = _trade_dates(ak)
    if target not in dates:
        return _closed_market(date_value, f"{date_value} 为非交易日，不生成行情数值。")
    latest = max(value for value in dates if value <= date.today())
    if target != latest:
        raise ValueError(f"AKShare 即时接口对应最近交易日 {latest}，不能用于目标日 {target}")

    at = datetime.combine(target, time(15), BEIJING)
    index_frame = ak.stock_zh_index_spot_em()
    stock_frame = ak.stock_zh_a_spot_em()
    sector_frame = ak.stock_board_industry_name_em()
    source_name = "AKShare / 东方财富公开行情"
    citation = _citation("akshare", "AKShare", "https://akshare.akfamily.xyz/", "AKShare A 股行情接口文档", "聚合公开行情，非实时；上游字段和可用性可能变化。")

    indices: list[dict[str, Any]] = []
    for _, row in index_frame.iterrows():
        code = str(row.get("代码", ""))[-6:]
        if code not in INDEX_NAMES:
            continue
        close = _number(row.get("最新价"))
        change = _number(row.get("涨跌幅"))
        turnover_raw = _number(row.get("成交额"))
        turnover = turnover_raw / 100_000_000 if turnover_raw is not None else None
        indices.append(
            {
                "code": code,
                "name": INDEX_NAMES[code],
                "close": _point(close, "点", source_name, at),
                "change_pct": _point(change, "%", source_name, at),
                "turnover": _point(turnover, "亿元", source_name, at),
                "trend": [close] if close is not None else [],
            }
        )
    indices.sort(key=lambda item: list(INDEX_NAMES).index(item["code"]))
    if len(indices) < 4:
        raise ValueError(f"关键指数仅取得 {len(indices)} 个，拒绝发布")

    changes = [_number(value) for value in stock_frame.get("涨跌幅", [])]
    changes = [value for value in changes if value is not None]
    if not changes:
        raise ValueError("全市场涨跌幅为空")
    up = sum(value > 0 for value in changes)
    down = sum(value < 0 for value in changes)
    flat = len(changes) - up - down
    ordered = sorted(changes)
    median = ordered[len(ordered) // 2] if len(ordered) % 2 else (ordered[len(ordered) // 2 - 1] + ordered[len(ordered) // 2]) / 2
    turnovers = [_number(value) for value in stock_frame.get("成交额", [])]
    total_turnover = sum(value for value in turnovers if value is not None) / 100_000_000
    breadth = {"up": up, "down": down, "flat": flat, "limit_up": sum(value >= 9.5 for value in changes), "limit_down": sum(value <= -9.5 for value in changes), "median_change_pct": round(median, 3)}
    if median >= 1:
        sentiment = "偏强"
    elif median <= -1:
        sentiment = "偏弱"
    else:
        sentiment = "中性"

    sectors: list[dict[str, Any]] = []
    if "涨跌幅" in sector_frame.columns:
        ranked = sector_frame.assign(_change=sector_frame["涨跌幅"].map(_number)).dropna(subset=["_change"]).sort_values("_change", ascending=False).head(3)
        for position, (_, row) in enumerate(ranked.iterrows()):
            change = float(row["_change"])
            sectors.append(
                {
                    "name": str(row.get("板块名称", "未命名行业")),
                    "change_pct": change,
                    "heat_score": max(0, min(100, 75 - position * 8)),
                    "driver_type": "情绪",
                    "catalyst": "仅确认当日板块价格表现，未把涨幅归因为未经核验的事件或政策。",
                    "chain": ["公开行情", "板块涨跌幅", "市场关注度"],
                    "sustainability": "需结合订单、盈利、现金流与政策原文继续验证。",
                    "watch_next": "成交持续性、上涨广度及基本面信息",
                    "invalidation": "次日快速回落或缺少基本面证据",
                    "representatives": ["不列个股，避免把板块热度误作推荐"],
                    "risk": "单日价格信号噪声较大",
                }
            )

    market = record_base(f"market-{date_value}", date_value, ["akshare"])
    market.update(
        {
            "trading_date": date_value,
            "market_status": "closed",
            "status_note": f"{date_value} 收盘数据；非实时，最终口径以上游市场数据为准。",
            "indices": indices,
            "market_breadth": breadth,
            "turnover": _point(round(total_turnover, 2), "亿元", source_name, at),
            "sentiment": sentiment,
            "sentiment_basis": [f"上涨 {up} 家、下跌 {down} 家、平盘 {flat} 家", f"全市场涨跌幅中位数 {median:.2f}%", "涨跌停家数按涨跌幅阈值近似统计，非交易所精确口径"],
            "sectors": sectors,
            "research_candidate": _empty_candidate(date_value, citation),
            "data_quality": {"status": "complete" if len(indices) == len(INDEX_NAMES) and len(sectors) == 3 else "partial", "completeness": round(min(1, (len(indices) / len(INDEX_NAMES)) * 0.7 + (len(sectors) / 3) * 0.3), 2), "conflicts": [], "notes": ["价格与成交为聚合公开行情", "涨跌停家数采用 9.5% 阈值近似，未区分 ST 和不同交易板块", "未将单日表现用于短线预测"]},
            "sources": [citation],
            "is_demo": False,
        }
    )
    return seal(market)


def _baostock_market(date_value: str) -> dict[str, Any]:
    import baostock as bs

    target = date.fromisoformat(date_value)
    if target.weekday() >= 5:
        return _closed_market(date_value, f"{date_value} 为周末，不生成行情数值。")
    login = bs.login()
    if login.error_code != "0":
        raise RuntimeError(f"BaoStock login: {login.error_msg}")
    at = datetime.combine(target, time(15), BEIJING)
    citation = _citation("baostock", "BaoStock", "http://baostock.com/", "BaoStock 证券数据平台", "降级来源仅提供部分指数日线，市场广度与行业数据缺失。")
    codes = {"000001": "sh.000001", "399001": "sz.399001", "399006": "sz.399006", "000300": "sh.000300", "000905": "sh.000905", "000688": "sh.000688"}
    indices: list[dict[str, Any]] = []
    try:
        for code, provider_code in codes.items():
            result = bs.query_history_k_data_plus(provider_code, "date,code,close,pctChg,amount", start_date=date_value, end_date=date_value, frequency="d", adjustflag="3")
            if result.error_code != "0" or not result.next():
                continue
            row = dict(zip(result.fields, result.get_row_data(), strict=True))
            close = _number(row.get("close"))
            change = _number(row.get("pctChg"))
            amount = _number(row.get("amount"))
            indices.append({"code": code, "name": INDEX_NAMES[code], "close": _point(close, "点", "BaoStock", at), "change_pct": _point(change, "%", "BaoStock", at), "turnover": _point(amount / 100_000_000 if amount is not None else None, "亿元", "BaoStock", at), "trend": [close] if close is not None else []})
    finally:
        bs.logout()
    if not indices:
        raise ValueError("BaoStock 未返回目标日指数数据")
    market = record_base(f"market-{date_value}", date_value, ["baostock"])
    market.update({"trading_date": date_value, "market_status": "closed", "status_note": f"{date_value} 收盘数据；AKShare 不可用，已降级到 BaoStock。", "indices": indices, "market_breadth": {"up": None, "down": None, "flat": None, "limit_up": None, "limit_down": None, "median_change_pct": None}, "turnover": _point(None, "亿元", "BaoStock", at, note="降级来源缺少全市场成交额"), "sentiment": "中性", "sentiment_basis": ["降级数据不足，不判断全市场情绪"], "sectors": [], "research_candidate": _empty_candidate(date_value, citation), "data_quality": {"status": "partial", "completeness": round(len(indices) / len(INDEX_NAMES) * 0.5, 2), "conflicts": [], "notes": ["仅有部分指数日线", "市场广度、行业和基本面数据不可用"]}, "sources": [citation], "is_demo": False})
    return seal(market)


def generate_market(date_value: str, provider: str = "akshare") -> tuple[dict[str, Any], list[str]]:
    failures: list[str] = []
    providers = [_akshare_market, _baostock_market] if provider == "akshare" else [_baostock_market]
    for fetcher in providers:
        try:
            return fetcher(date_value), failures
        except Exception as exc:
            failures.append(f"{fetcher.__name__}: {type(exc).__name__}: {exc}")
    raise RuntimeError("；".join(failures))
