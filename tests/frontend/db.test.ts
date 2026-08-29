import { deleteDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearUserData,
  exportUserData,
  getFavoriteByContent,
  importUserData,
  listFavorites,
  recordWrongAnswer,
  resetDBForTests,
  saveFavorite,
} from "@/lib/db";
import type { FavoriteRecord } from "@/types/user-data";

const favorite: FavoriteRecord = {
  id: "fav-test",
  contentId: "news-test",
  type: "新闻",
  title: "测试收藏",
  excerpt: "摘要",
  date: "2026-08-29",
  tags: ["测试"],
  category: "新闻",
  note: "",
  mastered: false,
  pinned: false,
  createdAt: "2026-08-29T00:00:00Z",
  updatedAt: "2026-08-29T00:00:00Z",
};

describe("IndexedDB personal data", () => {
  beforeEach(async () => {
    await resetDBForTests();
    await deleteDB("insight-daily-dashboard");
    await resetDBForTests();
  });

  it("stores and retrieves favorites", async () => {
    await saveFavorite(favorite);
    expect((await getFavoriteByContent("news-test"))?.title).toBe("测试收藏");
    expect(await listFavorites()).toHaveLength(1);
  });

  it("creates spaced-review wrong answers", async () => {
    const wrong = await recordWrongAnswer({
      questionId: "q1",
      questionTitle: "题目",
      userAnswer: "B",
      correctAnswer: "A",
      durationSeconds: 30,
      confidence: 1,
      knowledgeTags: ["判断"],
      mastered: false,
      note: "",
    });
    expect(wrong.errorCount).toBe(1);
    expect(new Date(wrong.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("exports, clears and imports versioned data", async () => {
    await saveFavorite(favorite);
    const backup = await exportUserData();
    await clearUserData();
    expect(await listFavorites()).toHaveLength(0);
    await importUserData(backup);
    expect(await listFavorites()).toHaveLength(1);
  });
});
