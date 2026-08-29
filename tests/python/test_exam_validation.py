import json
from decimal import Decimal
from pathlib import Path

from insight_dashboard.exam import spaced_review_days, validate_numeric_answer, validate_question
from insight_dashboard.models import Question

ROOT = Path(__file__).resolve().parents[2]


def questions() -> list[Question]:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))["exam"]["questions"]
    return [Question.model_validate(item) for item in payload]


def test_all_demo_questions_have_unique_answers() -> None:
    assert all(not validate_question(question) for question in questions())


def test_numeric_question_is_recalculated() -> None:
    numeric = next(item for item in questions() if item.stem.startswith("某服务事项"))
    assert validate_numeric_answer(numeric, Decimal("40"))


def test_spaced_review_schedule() -> None:
    assert [spaced_review_days(count) for count in range(1, 7)] == [1, 3, 7, 14, 30, 30]
