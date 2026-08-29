import { describe, expect, it } from "vitest";
import { allDigests } from "@/lib/data";
import { buildSearchRecords, searchRecords } from "@/lib/search";

describe("cross-module search", () => {
  const records = buildSearchRecords(allDigests);

  it("indexes all requested content types", () => {
    expect(new Set(records.map((item) => item.type))).toEqual(
      new Set(["新闻", "深度分析", "行业", "个股研究", "行测题", "申论"]),
    );
  });

  it("finds Chinese keywords and filters by type", () => {
    expect(searchRecords(records, "数字政府").length).toBeGreaterThan(0);
    expect(
      searchRecords(records, "数字政府", "申论").every(
        (item) => item.type === "申论",
      ),
    ).toBe(true);
  });
});
