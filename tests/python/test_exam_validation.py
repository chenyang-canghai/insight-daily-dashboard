import json
from decimal import Decimal
from pathlib import Path

from insight_dashboard.exam import spaced_review_days, validate_numeric_answer, validate_question
from insight_dashboard.live_exam import generate_exam
from insight_dashboard.models import Question

ROOT = Path(__file__).resolve().parents[2]


def questions() -> list[Question]:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))["exam"]["questions"]
    return [Question.model_validate(item) for item in payload]


def test_all_demo_questions_have_unique_answers() -> None:
    assert all(not validate_question(question) for question in questions())


def test_numeric_question_is_recalculated() -> None:
    payload = generate_exam("2026-08-29")
    numeric = Question.model_validate(next(item for item in payload["questions"] if "办理时间" in item["stem"]))
    assert validate_numeric_answer(numeric, Decimal("25"))


def test_spaced_review_schedule() -> None:
    assert [spaced_review_days(count) for count in range(1, 7)] == [1, 3, 7, 14, 30, 30]
