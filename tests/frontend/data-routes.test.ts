import { describe, expect, it } from "vitest";
import {
  allDigests,
  archiveIndex,
  getDigest,
  getNewsItem,
  latestDigest,
} from "@/lib/data";

describe("generated digest routes", () => {
  it("keeps the latest digest and archive in the generated collection", () => {
    expect(allDigests.map((digest) => digest.date)).toEqual(
      archiveIndex.entries.map((entry) => entry.date),
    );
    expect(getDigest(latestDigest.date)).toBeDefined();
  });

  it("makes every latest news item available to the detail route", () => {
    for (const item of latestDigest.news) {
      expect(getNewsItem(item.id)?.item.id).toBe(item.id);
    }
  });
});
