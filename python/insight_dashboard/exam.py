from __future__ import annotations

from decimal import Decimal

from .models import Question


def validate_question(question: Question) -> list[str]:
    errors: list[str] = []
    if question.source_type not in {"official", "licensed", "original", "original_demo"}:
        errors.append("unapproved question source")
    if question.correct_answer not in question.options:
        errors.append("correct answer missing from options")
    if len(set(question.options.values())) != len(question.options):
        errors.append("duplicate option text")
    return errors


def validate_numeric_answer(question: Question, calculated: Decimal, tolerance: Decimal = Decimal("0.0001")) -> bool:
    option = question.options[question.correct_answer]
    normalized = option.replace("%", "").replace(",", "").strip()
    try:
        stated = Decimal(normalized)
    except Exception:
        return False
    return abs(stated - calculated) <= tolerance


def spaced_review_days(error_count: int) -> int:
    schedule = [1, 3, 7, 14, 30]
    return schedule[min(max(error_count - 1, 0), len(schedule) - 1)]
