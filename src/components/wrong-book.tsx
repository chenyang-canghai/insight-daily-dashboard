"use client";

import { CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listWrongAnswers, removeWrongAnswer, saveWrongAnswer } from "@/lib/db";
import { formatBeijingDate } from "@/lib/utils";
import type { WrongAnswerRecord } from "@/types/user-data";

export function WrongBook() {
  const [items, setItems] = useState<WrongAnswerRecord[]>([]);
  const refresh = () => listWrongAnswers().then(setItems);
  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt)),
    [items],
  );

  if (!sorted.length)
    return (
      <div className="empty-state">
        <CheckCircle2 size={28} />
        <h2>错题本还是空的</h2>
        <p>提交错误答案后，题目会自动进入 1 / 3 / 7 / 14 / 30 天间隔复习。</p>
      </div>
    );

  return (
    <div className="favorite-list">
      {sorted.map((item) => (
        <article className="favorite-record" key={item.id}>
          <div className="favorite-record-head">
            <span className="category-label">错题 · {item.errorCount} 次</span>
            <span>
              {item.mastered
                ? "已掌握"
                : `复习 ${formatBeijingDate(item.nextReviewAt)}`}
            </span>
          </div>
          <h3>{item.questionTitle}</h3>
          <p>
            你的答案：{item.userAnswer}　正确答案：{item.correctAnswer}　用时：
            {item.durationSeconds} 秒
          </p>
          <label>
            错因笔记
            <textarea
              rows={2}
              value={item.note}
              onChange={(event) =>
                setItems((current) =>
                  current.map((record) =>
                    record.id === item.id
                      ? { ...record, note: event.target.value }
                      : record,
                  ),
                )
              }
              onBlur={async () => {
                await saveWrongAnswer(item);
                await refresh();
              }}
            />
          </label>
          <div className="favorite-record-footer">
            <span>{item.knowledgeTags.join(" / ")}</span>
            <div>
              <button
                type="button"
                onClick={async () => {
                  await saveWrongAnswer({ ...item, mastered: !item.mastered });
                  await refresh();
                }}
              >
                <CheckCircle2 size={14} />
                {item.mastered ? "继续复习" : "标记掌握"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await removeWrongAnswer(item.id);
                  await refresh();
                }}
              >
                <Trash2 size={14} />
                移除
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
