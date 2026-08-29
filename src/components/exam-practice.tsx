"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { recordWrongAnswer, saveAttempt } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/content";

export function ExamPractice({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confidence, setConfidence] = useState<1 | 2 | 3>(2);
  const [message, setMessage] = useState("");
  const startedAt = useRef<number | null>(null);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const question = questions[index];
  const selected = question ? answers[question.id] : undefined;
  const isRevealed = question ? revealed[question.id] : false;
  const completed = useMemo(() => Object.keys(revealed).length, [revealed]);

  if (!question) return <p>今日暂无可用题目。</p>;

  const submit = async () => {
    if (!selected || isRevealed) return;
    const durationSeconds =
      startedAt.current === null
        ? 1
        : Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const correct = selected === question.correct_answer;
    setRevealed((current) => ({ ...current, [question.id]: true }));
    setMessage(correct ? "回答正确，继续保持。" : "已加入错题复习计划。");
    await saveAttempt({
      id: `attempt-${question.id}-${Date.now()}`,
      questionId: question.id,
      date: question.date,
      userAnswer: selected,
      correctAnswer: question.correct_answer,
      correct,
      durationSeconds,
      confidence,
      questionType: question.question_type,
      knowledgeTags: question.tags,
      createdAt: new Date().toISOString(),
    });
    if (!correct) {
      await recordWrongAnswer({
        questionId: question.id,
        questionTitle: question.stem,
        userAnswer: selected,
        correctAnswer: question.correct_answer,
        durationSeconds,
        confidence,
        knowledgeTags: question.tags,
        mastered: false,
        note: "",
      });
    }
  };

  const go = (next: number) => {
    setIndex(Math.min(Math.max(next, 0), questions.length - 1));
    setMessage("");
    setConfidence(2);
    startedAt.current = Date.now();
  };

  const reset = () => {
    setAnswers({});
    setRevealed({});
    setIndex(0);
    setMessage("");
    startedAt.current = Date.now();
  };

  return (
    <section className="practice-shell" aria-labelledby="practice-title">
      <div className="practice-head">
        <div>
          <span className="eyebrow">今日行测 · 原创 demo</span>
          <h2 id="practice-title">
            第 {index + 1} 题 / 共 {questions.length} 题
          </h2>
        </div>
        <div
          className="practice-progress"
          aria-label={`已完成 ${completed} 题`}
        >
          <span style={{ width: `${(completed / questions.length) * 100}%` }} />
        </div>
        <button type="button" className="ghost-button" onClick={reset}>
          <RotateCcw size={15} />
          重新练习
        </button>
      </div>

      <article className="question-card" id={question.id}>
        <div className="question-meta">
          <span>{question.question_type}</span>
          <span>{question.difficulty}</span>
          <span>
            <Clock3 size={14} />
            建议 {question.suggested_seconds} 秒
          </span>
        </div>
        <h3>{question.stem}</h3>
        {question.material && (
          <p className="question-material">{question.material}</p>
        )}
        <div className="option-list" role="radiogroup" aria-label="选择答案">
          {Object.entries(question.options).map(([key, value]) => {
            const correct = isRevealed && key === question.correct_answer;
            const wrong =
              isRevealed && selected === key && key !== question.correct_answer;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected === key}
                className={cn(
                  "option-button",
                  selected === key && "selected",
                  correct && "correct",
                  wrong && "wrong",
                )}
                key={key}
                disabled={isRevealed}
                onClick={() =>
                  setAnswers((current) => ({ ...current, [question.id]: key }))
                }
              >
                <b>{key}</b>
                <span>{value}</span>
                {correct && <CheckCircle2 size={18} />}
                {wrong && <XCircle size={18} />}
              </button>
            );
          })}
        </div>

        {!isRevealed && (
          <div className="answer-actions">
            <label>
              自评信心
              <select
                value={confidence}
                onChange={(event) =>
                  setConfidence(Number(event.target.value) as 1 | 2 | 3)
                }
              >
                <option value={1}>1 · 不确定</option>
                <option value={2}>2 · 一般</option>
                <option value={3}>3 · 确定</option>
              </select>
            </label>
            <button
              className="primary-button"
              type="button"
              disabled={!selected}
              onClick={submit}
            >
              提交并查看解析
            </button>
          </div>
        )}

        {isRevealed && (
          <div className="answer-panel" aria-live="polite">
            <div
              className={
                selected === question.correct_answer
                  ? "answer-status correct"
                  : "answer-status wrong"
              }
            >
              {message}
            </div>
            <dl>
              <div>
                <dt>正确答案</dt>
                <dd>{question.correct_answer}</dd>
              </div>
              <div>
                <dt>核心考点</dt>
                <dd>{question.tags.join("、")}</dd>
              </div>
              <div>
                <dt>完整解析</dt>
                <dd>{question.explanation}</dd>
              </div>
              <div>
                <dt>最快方法</dt>
                <dd>{question.fastest_method}</dd>
              </div>
              <div>
                <dt>常见陷阱</dt>
                <dd>{question.traps.join("；")}</dd>
              </div>
            </dl>
          </div>
        )}
      </article>

      <div className="question-nav">
        <button
          className="secondary-button"
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          <ChevronLeft size={17} />
          上一题
        </button>
        <div>
          {questions.map((item, itemIndex) => (
            <button
              type="button"
              aria-label={`第 ${itemIndex + 1} 题`}
              key={item.id}
              className={cn(
                "question-dot",
                itemIndex === index && "current",
                revealed[item.id] && "done",
              )}
              onClick={() => go(itemIndex)}
            >
              {itemIndex + 1}
            </button>
          ))}
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={index === questions.length - 1}
          onClick={() => go(index + 1)}
        >
          下一题
          <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}
