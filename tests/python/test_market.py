from datetime import date

from insight_dashboard.market import (
    FallbackMarketClient,
    conflict_aware_value,
    is_a_share_trading_day,
    select_research_candidate,
)


class FailingProvider:
    name = "failed"
    def fetch_daily(self, trading_date: date) -> dict:
        raise TimeoutError("timeout")


class BackupProvider:
    name = "backup"
    def fetch_daily(self, trading_date: date) -> dict:
        return {"date": trading_date.isoformat()}


def test_trading_day_guard() -> None:
    assert is_a_share_trading_day(date(2026, 8, 28))
    assert not is_a_share_trading_day(date(2026, 8, 29))
    assert not is_a_share_trading_day(date(2026, 8, 28), {date(2026, 8, 28)})


def test_market_provider_fallback() -> None:
    result = FallbackMarketClient([FailingProvider(), BackupProvider()]).fetch(date(2026, 8, 28))
    assert result.provider == "backup"
    assert len(result.failures) == 1


def test_candidate_can_be_empty() -> None:
    assert select_research_candidate([{"score": 69}, {"score": 90, "excluded": True}]) is None
    assert select_research_candidate([{"score": 75, "information_quality": 8}])["score"] == 75


def test_conflicts_are_visible() -> None:
    value, conflicts = conflict_aware_value([("primary", 10), ("backup", 12)], tolerance=0.5, priority=lambda name: 0 if name == "primary" else 1)
    assert value == 10
    assert conflicts
