"use client";

import { useEffect, useState } from "react";
import { exportUserData } from "@/lib/db";

export function PersonalSnapshot() {
  const [snapshot, setSnapshot] = useState({
    attempts: 0,
    accuracy: 0,
    wrongDue: 0,
    streak: 0,
  });
  useEffect(() => {
    exportUserData()
      .then((data) => {
        const cutoff = Date.now() - 7 * 86400000;
        const recent = data.attempts.filter(
          (item) => new Date(item.createdAt).getTime() >= cutoff,
        );
        const dates = new Set(
          data.attempts.map((item) => item.createdAt.slice(0, 10)),
        );
        const due = data.wrongAnswers.filter(
          (item) =>
            !item.mastered &&
            new Date(item.nextReviewAt).getTime() <= Date.now(),
        ).length;
        setSnapshot({
          attempts: recent.length,
          accuracy: recent.length
            ? Math.round(
                (recent.filter((item) => item.correct).length / recent.length) *
                  100,
              )
            : 0,
          wrongDue: due,
          streak: dates.size,
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="hero-aside" aria-label="个人学习摘要">
      <div className="metric-tile">
        <small>近 7 天答题</small>
        <strong>{snapshot.attempts}</strong>
        <span>当前浏览器</span>
      </div>
      <div className="metric-tile">
        <small>正确率</small>
        <strong>{snapshot.accuracy}%</strong>
        <span>基于已提交题目</span>
      </div>
      <div className="metric-tile">
        <small>待复习错题</small>
        <strong>{snapshot.wrongDue}</strong>
        <span>按 1/3/7/14/30 天</span>
      </div>
      <div className="metric-tile">
        <small>学习日期</small>
        <strong>{snapshot.streak}</strong>
        <span>本地记录天数</span>
      </div>
    </div>
  );
}
