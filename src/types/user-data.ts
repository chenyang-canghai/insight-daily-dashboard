export type FavoriteType =
  | "新闻"
  | "深度分析"
  | "行业"
  | "个股研究"
  | "行测题"
  | "申论素材"
  | "金句"
  | "案例"
  | "自定义笔记";

export interface FavoriteRecord {
  id: string;
  contentId: string;
  type: FavoriteType;
  title: string;
  excerpt: string;
  source?: string;
  sourceUrl?: string;
  date: string;
  tags: string[];
  category: string;
  note: string;
  mastered: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptRecord {
  id: string;
  questionId: string;
  date: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  durationSeconds: number;
  confidence: 1 | 2 | 3;
  questionType: string;
  knowledgeTags: string[];
  createdAt: string;
}

export interface WrongAnswerRecord {
  id: string;
  questionId: string;
  questionTitle: string;
  userAnswer: string;
  correctAnswer: string;
  errorCount: number;
  lastErrorAt: string;
  durationSeconds: number;
  confidence: 1 | 2 | 3;
  knowledgeTags: string[];
  mastered: boolean;
  note: string;
  nextReviewAt: string;
  reviewStep: number;
}

export interface UserSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface UserDataExport {
  schemaVersion: "1.0.0";
  exportedAt: string;
  favorites: FavoriteRecord[];
  attempts: AttemptRecord[];
  wrongAnswers: WrongAnswerRecord[];
}
