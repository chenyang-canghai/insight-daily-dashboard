export type GenerationStatus =
  "demo" | "success" | "partial" | "stale" | "failed";
export type Reliability = "A" | "B" | "C" | "demo";

export interface BaseMeta {
  schema_version: string;
  id: string;
  date: string;
  generated_at: string;
  timezone: "Asia/Shanghai";
  source_ids: string[];
  content_hash: string;
  generation_status: GenerationStatus;
  validation_errors: string[];
}

export interface Citation {
  source_id: string;
  source_name: string;
  url: string;
  title: string;
  published_at?: string;
  note?: string;
}

export interface NewsItem extends BaseMeta {
  title: string;
  category: string;
  regions: string[];
  published_at: string;
  collected_at: string;
  source_name: string;
  source_url: string;
  summary: string;
  why_it_matters: string;
  importance_score: number;
  reliability: Reliability;
  tags: string[];
  facts: string[];
  inferences: string[];
  citations: Citation[];
  related_items: string[];
  reading_minutes: number;
  is_demo: boolean;
  freshness?: "new" | "follow_up";
  first_seen_date?: string | null;
  evidence_level?: "metadata_only" | "official_summary" | "official_page";
}

export interface TimelineEntry {
  time: string;
  label: string;
  status: "confirmed" | "context" | "watch" | "demo";
}

export interface DeepDive extends BaseMeta {
  news_ids: string[];
  title: string;
  one_sentence: string;
  background: string;
  timeline: TimelineEntry[];
  stakeholders: string[];
  mechanism: string;
  impact_chain: string[];
  beneficiaries: string[];
  pressured_groups: string[];
  short_term: string;
  medium_term: string;
  long_term: string;
  unknowns: string[];
  confidence: "低" | "中" | "中高" | "高" | "demo";
  student_insights: string[];
  shenlun_material: {
    theme: string;
    expressions: string[];
    case: string;
    argument: string;
  };
  citations: Citation[];
  is_demo: boolean;
}

export interface DataPoint {
  value: number | null;
  unit: string;
  source: string;
  data_time: string;
  adjusted: boolean;
  realtime: boolean;
  estimated: boolean;
  missing: boolean;
  note?: string;
}

export interface MarketIndex {
  code: string;
  name: string;
  close: DataPoint;
  change_pct: DataPoint;
  turnover: DataPoint;
  trend: number[];
}

export interface Sector {
  name: string;
  change_pct: number;
  heat_score: number;
  driver_type: "政策" | "业绩" | "事件" | "情绪" | "demo";
  catalyst: string;
  chain: string[];
  sustainability: string;
  watch_next: string;
  invalidation: string;
  representatives: string[];
  risk: string;
}

export interface ResearchCandidate {
  code: string;
  name: string;
  industry: string;
  selected: boolean;
  no_selection_reason: string | null;
  score: number | null;
  score_breakdown: Record<string, number>;
  business_model: string;
  selection_reason: string;
  fundamentals: Record<string, string>;
  valuation: Record<string, string>;
  technical_snapshot: Record<string, string>;
  catalysts: string[];
  risks: string[];
  scenarios: Record<"optimistic" | "base" | "pessimistic", string>;
  invalidation_conditions: string[];
  conclusion:
    "值得持续跟踪" | "保持观察" | "当前风险收益比不佳" | "数据不足，暂不判断";
  data_as_of: string;
  citations: Citation[];
  is_demo: boolean;
}

export interface MarketDaily extends BaseMeta {
  trading_date: string;
  market_status: "open" | "closed" | "unknown" | "demo";
  status_note: string;
  indices: MarketIndex[];
  market_breadth: {
    up: number | null;
    down: number | null;
    flat: number | null;
    limit_up: number | null;
    limit_down: number | null;
    median_change_pct: number | null;
  };
  turnover: DataPoint;
  sentiment: "极弱" | "偏弱" | "中性" | "偏强" | "过热";
  sentiment_basis: string[];
  sectors: Sector[];
  research_candidate: ResearchCandidate;
  data_quality: {
    status: "demo" | "complete" | "partial" | "conflict" | "unavailable";
    completeness: number;
    conflicts: string[];
    notes: string[];
  };
  sources: Citation[];
  is_demo: boolean;
}

export interface Question extends BaseMeta {
  source_type: "original" | "original_demo" | "official" | "licensed";
  source_name: string;
  year: number;
  region: string;
  exam_type: string;
  question_type: string;
  difficulty: "基础" | "中等" | "进阶";
  stem: string;
  material: string | null;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  fastest_method: string;
  traps: string[];
  suggested_seconds: number;
  tags: string[];
  is_demo: boolean;
}

export interface ShenlunDaily extends BaseMeta {
  current_affairs: Array<{
    title: string;
    event_summary: string;
    policy_background: string;
    theme: string;
    arguments: string[];
    case: string;
    suitable_questions: string[];
  }>;
  golden_sentences: Array<{
    type: "权威原文" | "政策规范表达" | "系统原创总结句";
    text: string;
    source?: Citation;
  }>;
  standard_expressions: Array<{
    plain: string;
    formal: string;
    scenario: string;
    example: string;
  }>;
  case_material: {
    name: string;
    time_place: string;
    practice: string;
    problem: string;
    result: string;
    lesson: string;
    themes: string[];
    limitation: string;
    source: Citation;
  };
  micro_practice: {
    type: string;
    material: string;
    requirement: string;
    word_limit: number;
    reference_answer: string;
    scoring_points: string[];
    common_mistakes: string[];
    strong_expressions: string[];
  };
  weekly_essay: null | {
    theme: string;
    title: string;
    thesis: string;
    arguments: string[];
    outline: string[];
  };
  is_demo: boolean;
}

export interface ExamDaily extends BaseMeta {
  questions: Question[];
  shenlun: ShenlunDaily;
  is_demo: boolean;
}

export interface TaskStatus {
  module: "news" | "market" | "exam";
  scheduled_time: string;
  last_run: string;
  status: GenerationStatus;
  freshness: "fresh" | "stale" | "demo";
  message: string;
}

export interface DailyDigest extends BaseMeta {
  title: string;
  overview: string;
  is_demo: boolean;
  task_statuses: TaskStatus[];
  news: NewsItem[];
  deep_dives: DeepDive[];
  market: MarketDaily;
  exam: ExamDaily;
}

export interface ArchiveEntry {
  date: string;
  title: string;
  mode: GenerationStatus;
  news_count: number;
  deep_dive_count: number;
  question_count: number;
  market_status: MarketDaily["market_status"];
  path: string;
}

export interface ArchiveIndex {
  schema_version: string;
  generated_at: string;
  timezone: "Asia/Shanghai";
  entries: ArchiveEntry[];
}
