"use client";

import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { exportUserData } from "@/lib/db";

function toBeijingDay(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function learningStreak(values: string[]) {
  const days = new Set(
    values
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .map(toBeijingDay),
  );
  const cursor = new Date();
  if (!days.has(toBeijingDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(toBeijingDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

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
          streak: learningStreak(data.attempts.map((item) => item.createdAt)),
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="rail-block personal-rail" aria-label="个人学习摘要">
      <div className="rail-heading rail-heading-gold">
        <CalendarDays size={22} aria-hidden="true" />
        <h2>学习连胜</h2>
      </div>
      <strong className="learning-streak">
        {snapshot.streak} <small>天</small>
      </strong>
      <p>
        近 7 天完成 {snapshot.attempts} 题 · 正确率 {snapshot.accuracy}%
      </p>
      <Link className="rail-text-link" href="/exam/">
        {snapshot.wrongDue
          ? `${snapshot.wrongDue} 道错题待复习`
          : "查看学习记录"}
        <ChevronRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}
