from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from typing import Any, Protocol


class MarketProvider(Protocol):
    name: str

    def fetch_daily(self, trading_date: date) -> dict[str, Any]: ...


def is_a_share_trading_day(value: date, holidays: set[date] | None = None) -> bool:
    return value.weekday() < 5 and value not in (holidays or set())


@dataclass(slots=True)
class ProviderFailure:
    provider: str
    error: str


@dataclass(slots=True)
class MarketFetchResult:
    data: dict[str, Any] | None
    provider: str | None
    failures: list[ProviderFailure]


class FallbackMarketClient:
    def __init__(self, providers: list[MarketProvider]) -> None:
        if not providers:
            raise ValueError("at least one provider is required")
        self.providers = providers

    def fetch(self, trading_date: date) -> MarketFetchResult:
        failures: list[ProviderFailure] = []
        for provider in self.providers:
            try:
                data = provider.fetch_daily(trading_date)
                if data:
                    return MarketFetchResult(data=data, provider=provider.name, failures=failures)
                failures.append(ProviderFailure(provider.name, "empty response"))
            except Exception as exc:  # provider boundary must capture diagnostics
                failures.append(ProviderFailure(provider.name, f"{type(exc).__name__}: {exc}"))
        return MarketFetchResult(data=None, provider=None, failures=failures)


def select_research_candidate(candidates: list[dict[str, Any]], minimum_score: float = 70) -> dict[str, Any] | None:
    eligible = [item for item in candidates if not item.get("excluded") and float(item.get("score", 0)) >= minimum_score]
    if not eligible:
        return None
    return max(eligible, key=lambda item: (float(item["score"]), float(item.get("information_quality", 0))))


def conflict_aware_value(values: list[tuple[str, float]], tolerance: float, priority: Callable[[str], int]) -> tuple[float | None, list[str]]:
    if not values:
        return None, ["no source value"]
    ordered = sorted(values, key=lambda item: priority(item[0]))
    selected_source, selected = ordered[0]
    conflicts = [f"{source}={value} conflicts with {selected_source}={selected}" for source, value in ordered[1:] if abs(value - selected) > tolerance]
    return selected, conflicts
