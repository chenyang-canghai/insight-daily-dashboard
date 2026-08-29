import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  AttemptRecord,
  FavoriteRecord,
  UserDataExport,
  UserSetting,
  WrongAnswerRecord,
} from "@/types/user-data";

interface InsightDB extends DBSchema {
  favorites: {
    key: string;
    value: FavoriteRecord;
    indexes: { "by-content": string; "by-type": string; "by-date": string };
  };
  attempts: {
    key: string;
    value: AttemptRecord;
    indexes: { "by-question": string; "by-date": string };
  };
  wrongAnswers: {
    key: string;
    value: WrongAnswerRecord;
    indexes: { "by-question": string; "by-review": string };
  };
  settings: {
    key: string;
    value: UserSetting;
  };
}

const DB_NAME = "insight-daily-dashboard";
const DB_VERSION = 1;
let dbPromise: Promise<IDBPDatabase<InsightDB>> | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined")
    throw new Error("IndexedDB is only available in the browser");
  dbPromise ??= openDB<InsightDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const favorites = db.createObjectStore("favorites", { keyPath: "id" });
      favorites.createIndex("by-content", "contentId", { unique: true });
      favorites.createIndex("by-type", "type");
      favorites.createIndex("by-date", "date");

      const attempts = db.createObjectStore("attempts", { keyPath: "id" });
      attempts.createIndex("by-question", "questionId");
      attempts.createIndex("by-date", "date");

      const wrongAnswers = db.createObjectStore("wrongAnswers", {
        keyPath: "id",
      });
      wrongAnswers.createIndex("by-question", "questionId", { unique: true });
      wrongAnswers.createIndex("by-review", "nextReviewAt");

      db.createObjectStore("settings", { keyPath: "key" });
    },
  });
  return dbPromise;
}

export async function listFavorites() {
  return (await getDB()).getAll("favorites");
}

export async function getFavoriteByContent(contentId: string) {
  return (await getDB()).getFromIndex("favorites", "by-content", contentId);
}

export async function saveFavorite(record: FavoriteRecord) {
  await (await getDB()).put("favorites", record);
  return record;
}

export async function removeFavorite(id: string) {
  await (await getDB()).delete("favorites", id);
}

export async function saveAttempt(record: AttemptRecord) {
  await (await getDB()).put("attempts", record);
}

const REVIEW_DAYS = [1, 3, 7, 14, 30];

export async function recordWrongAnswer(
  input: Omit<
    WrongAnswerRecord,
    "id" | "errorCount" | "lastErrorAt" | "nextReviewAt" | "reviewStep"
  >,
) {
  const db = await getDB();
  const existing = await db.getFromIndex(
    "wrongAnswers",
    "by-question",
    input.questionId,
  );
  const reviewStep = Math.min(
    existing ? existing.reviewStep + 1 : 0,
    REVIEW_DAYS.length - 1,
  );
  const next = new Date();
  next.setDate(next.getDate() + (REVIEW_DAYS[reviewStep] ?? 30));
  const record: WrongAnswerRecord = {
    ...input,
    id: existing?.id ?? `wrong-${input.questionId}`,
    errorCount: (existing?.errorCount ?? 0) + 1,
    lastErrorAt: new Date().toISOString(),
    nextReviewAt: next.toISOString(),
    reviewStep,
  };
  await db.put("wrongAnswers", record);
  return record;
}

export async function listWrongAnswers() {
  return (await getDB()).getAll("wrongAnswers");
}

export async function saveWrongAnswer(record: WrongAnswerRecord) {
  await (await getDB()).put("wrongAnswers", record);
  return record;
}

export async function removeWrongAnswer(id: string) {
  await (await getDB()).delete("wrongAnswers", id);
}

export async function exportUserData(): Promise<UserDataExport> {
  const db = await getDB();
  const [favorites, attempts, wrongAnswers] = await Promise.all([
    db.getAll("favorites"),
    db.getAll("attempts"),
    db.getAll("wrongAnswers"),
  ]);
  return {
    schemaVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    favorites,
    attempts,
    wrongAnswers,
  };
}

export async function importUserData(value: UserDataExport) {
  if (value.schemaVersion !== "1.0.0") throw new Error("不支持的备份版本");
  if (
    !Array.isArray(value.favorites) ||
    !Array.isArray(value.attempts) ||
    !Array.isArray(value.wrongAnswers)
  ) {
    throw new Error("备份文件结构无效");
  }
  const db = await getDB();
  const tx = db.transaction(
    ["favorites", "attempts", "wrongAnswers"],
    "readwrite",
  );
  await Promise.all([
    ...value.favorites.map((record) => tx.objectStore("favorites").put(record)),
    ...value.attempts.map((record) => tx.objectStore("attempts").put(record)),
    ...value.wrongAnswers.map((record) =>
      tx.objectStore("wrongAnswers").put(record),
    ),
  ]);
  await tx.done;
}

export async function clearUserData() {
  const db = await getDB();
  const tx = db.transaction(
    ["favorites", "attempts", "wrongAnswers"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("favorites").clear(),
    tx.objectStore("attempts").clear(),
    tx.objectStore("wrongAnswers").clear(),
  ]);
  await tx.done;
}

export async function resetDBForTests() {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
}
