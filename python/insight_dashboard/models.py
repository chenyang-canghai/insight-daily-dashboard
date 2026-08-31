from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator, model_validator

GenerationStatus = Literal["demo", "success", "partial", "stale", "failed"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class BaseRecord(StrictModel):
    schema_version: str = "1.0.0"
    id: str
    date: str
    generated_at: datetime
    timezone: Literal["Asia/Shanghai"] = "Asia/Shanghai"
    source_ids: list[str] = Field(default_factory=list)
    content_hash: str
    generation_status: GenerationStatus
    validation_errors: list[str] = Field(default_factory=list)


class Citation(StrictModel):
    source_id: str
    source_name: str
    url: AnyHttpUrl
    title: str
    published_at: datetime | None = None
    note: str | None = None


class NewsItem(BaseRecord):
    title: str
    category: str
    regions: list[str]
    published_at: datetime
    collected_at: datetime
    source_name: str
    source_url: AnyHttpUrl
    summary: str = Field(min_length=20, max_length=800)
    why_it_matters: str
    importance_score: int = Field(ge=0, le=100)
    reliability: Literal["A", "B", "C", "demo"]
    tags: list[str]
    facts: list[str]
    inferences: list[str]
    citations: list[Citation]
    related_items: list[str]
    reading_minutes: int = Field(ge=1, le=60)
    is_demo: bool
    freshness: Literal["new", "follow_up"] = "new"
    first_seen_date: str | None = None
    evidence_level: Literal["metadata_only", "official_summary", "official_page"] = "metadata_only"

    @model_validator(mode="after")
    def facts_require_sources(self) -> NewsItem:
        if not self.is_demo and self.facts and not self.citations:
            raise ValueError("non-demo facts require citations")
        return self


class TimelineEntry(StrictModel):
    time: str
    label: str
    status: Literal["confirmed", "context", "watch", "demo"]


class ShenlunMaterial(StrictModel):
    theme: str
    expressions: list[str]
    case: str
    argument: str


class DeepDive(BaseRecord):
    news_ids: list[str]
    title: str
    one_sentence: str
    background: str
    timeline: list[TimelineEntry]
    stakeholders: list[str]
    mechanism: str
    impact_chain: list[str] = Field(min_length=3)
    beneficiaries: list[str]
    pressured_groups: list[str]
    short_term: str
    medium_term: str
    long_term: str
    unknowns: list[str]
    confidence: Literal["低", "中", "中高", "高", "demo"]
    student_insights: list[str]
    shenlun_material: ShenlunMaterial
    citations: list[Citation]
    is_demo: bool


class DataPoint(StrictModel):
    value: float | None
    unit: str
    source: str
    data_time: datetime
    adjusted: bool
    realtime: bool
    estimated: bool
    missing: bool
    note: str | None = None

    @model_validator(mode="after")
    def missing_matches_value(self) -> DataPoint:
        if self.missing != (self.value is None):
            raise ValueError("missing must match whether value is null")
        return self


class MarketIndex(StrictModel):
    code: str
    name: str
    close: DataPoint
    change_pct: DataPoint
    turnover: DataPoint
    trend: list[float]


class Sector(StrictModel):
    name: str
    change_pct: float
    heat_score: int = Field(ge=0, le=100)
    driver_type: Literal["政策", "业绩", "事件", "情绪", "demo"]
    catalyst: str
    chain: list[str]
    sustainability: str
    watch_next: str
    invalidation: str
    representatives: list[str]
    risk: str


class ResearchCandidate(StrictModel):
    code: str
    name: str
    industry: str
    selected: bool
    no_selection_reason: str | None
    score: float | None
    score_breakdown: dict[str, float]
    business_model: str
    selection_reason: str
    fundamentals: dict[str, str]
    valuation: dict[str, str]
    technical_snapshot: dict[str, str]
    catalysts: list[str]
    risks: list[str]
    scenarios: dict[Literal["optimistic", "base", "pessimistic"], str]
    invalidation_conditions: list[str]
    conclusion: Literal["值得持续跟踪", "保持观察", "当前风险收益比不佳", "数据不足，暂不判断"]
    data_as_of: str
    citations: list[Citation]
    is_demo: bool

    @field_validator("code")
    @classmethod
    def valid_code(cls, value: str) -> str:
        if len(value) != 6 or not value.isdigit():
            raise ValueError("A-share code must be six digits")
        return value

    @model_validator(mode="after")
    def selection_is_consistent(self) -> ResearchCandidate:
        if self.selected and self.score is None:
            raise ValueError("selected candidate requires score")
        if not self.selected and not self.no_selection_reason:
            raise ValueError("unselected candidate requires reason")
        return self


class MarketBreadth(StrictModel):
    up: int | None
    down: int | None
    flat: int | None
    limit_up: int | None
    limit_down: int | None
    median_change_pct: float | None


class DataQuality(StrictModel):
    status: Literal["demo", "complete", "partial", "conflict", "unavailable"]
    completeness: float = Field(ge=0, le=1)
    conflicts: list[str]
    notes: list[str]


class MarketDaily(BaseRecord):
    trading_date: str
    market_status: Literal["open", "closed", "unknown", "demo"]
    status_note: str
    indices: list[MarketIndex]
    market_breadth: MarketBreadth
    turnover: DataPoint
    sentiment: Literal["极弱", "偏弱", "中性", "偏强", "过热"]
    sentiment_basis: list[str]
    sectors: list[Sector]
    research_candidate: ResearchCandidate
    data_quality: DataQuality
    sources: list[Citation]
    is_demo: bool


class Question(BaseRecord):
    source_type: Literal["original", "original_demo", "official", "licensed"]
    source_name: str
    year: int
    region: str
    exam_type: str
    question_type: str
    difficulty: Literal["基础", "中等", "进阶"]
    stem: str
    material: str | None
    options: dict[str, str]
    correct_answer: str
    explanation: str
    fastest_method: str
    traps: list[str]
    suggested_seconds: int = Field(gt=0, le=1800)
    tags: list[str]
    is_demo: bool

    @model_validator(mode="after")
    def answer_is_unique(self) -> Question:
        if self.correct_answer not in self.options:
            raise ValueError("correct answer must exist in options")
        if len(set(self.options.values())) != len(self.options):
            raise ValueError("option text must be unique")
        return self


class TaskStatus(StrictModel):
    module: Literal["news", "market", "exam"]
    scheduled_time: str
    last_run: datetime
    status: GenerationStatus
    freshness: Literal["fresh", "stale", "demo"]
    message: str


class ExamDaily(BaseRecord):
    questions: list[Question] = Field(min_length=8, max_length=8)
    shenlun: dict[str, Any]
    is_demo: bool


class DailyDigest(BaseRecord):
    title: str
    overview: str
    is_demo: bool
    task_statuses: list[TaskStatus]
    news: list[NewsItem] = Field(min_length=8, max_length=8)
    deep_dives: list[DeepDive] = Field(max_length=3)
    market: MarketDaily
    exam: ExamDaily
