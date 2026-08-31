import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from insight_dashboard.models import DailyDigest, Question

ROOT = Path(__file__).resolve().parents[2]


def test_demo_digest_validates() -> None:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))
    digest = DailyDigest.model_validate(payload)
    assert len(digest.news) == 8
    assert len(digest.deep_dives) <= 3
    assert len(digest.exam.questions) == 8


def test_question_rejects_missing_answer() -> None:
    payload = json.loads((ROOT / "data/manifests/latest.json").read_text(encoding="utf-8"))["exam"][
        "questions"
    ][0]
    payload["correct_answer"] = "Z"
    with pytest.raises(ValidationError):
        Question.model_validate(payload)
