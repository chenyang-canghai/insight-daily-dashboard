import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const archive = JSON.parse(
  readFileSync(
    new URL("../../data/manifests/archive-index.json", import.meta.url),
    "utf8",
  ),
) as { entries: Array<{ date: string }> };
const latest = JSON.parse(
  readFileSync(
    new URL("../../data/manifests/latest.json", import.meta.url),
    "utf8",
  ),
) as {
  date: string;
  news: Array<{ id: string }>;
  deep_dives: Array<{ news_ids: string[] }>;
};

test("exposes installable PWA assets", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    id: "./",
    start_url: "./",
    scope: "./",
    display: "standalone",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png" }),
      expect.objectContaining({ purpose: "maskable" }),
    ]),
  );
  const workerResponse = await request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  expect(await workerResponse.text()).toContain("insight-daily-v1");
  expect((await request.get("/offline.html")).ok()).toBe(true);
});

test("publishes the latest daily and news detail routes", async ({
  request,
}) => {
  expect((await request.get(`/daily/${latest.date}/`)).ok()).toBe(true);
  const analyzedIds = latest.deep_dives.flatMap((item) => item.news_ids);
  expect(new Set(analyzedIds)).toEqual(
    new Set(latest.news.map((item) => item.id)),
  );
  for (const item of latest.news) {
    const response = await request.get(`/news/${item.id}/`);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("核心判断");
  }
});

test("deep detail uses the compact four-part analysis", async ({ page }) => {
  const analyzedNewsId = latest.deep_dives[0]?.news_ids[0];
  expect(analyzedNewsId).toBeDefined();
  await page.goto(`/news/${analyzedNewsId}/`);

  await expect(page.getByRole("heading", { name: "核心判断" })).toBeVisible();
  await expect(page.getByText("以下是分析框架，不是已发生事实")).toBeVisible();
  await expect(page.getByText(/第五步：识别利益影响/)).toHaveCount(0);

  const chainOverflow = await page
    .locator(".impact-chain")
    .evaluate((element) => element.scrollWidth > element.clientWidth);
  expect(chainOverflow).toBe(false);
});

test("browse, favorite, practice, market and archive", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/真实来源|演示数据/).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/news\/news-/),
    page.getByRole("link", { name: /开始今日研判/ }).click(),
  ]);
  const articleHeading = page.getByRole("heading", { level: 1 }).first();
  await expect(articleHeading).toBeVisible();
  const articleTitle = await articleHeading.textContent();
  await page.getByRole("button", { name: "收藏" }).click();
  await expect(page.getByRole("button", { name: "取消收藏" })).toBeVisible();

  await page.goto("/exam/");
  await expect(page.getByText("正确答案")).toHaveCount(0);
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "提交并查看解析" }).click();
  await expect(page.getByText("正确答案")).toBeVisible();

  await page.goto("/market/");
  await expect(
    page.getByRole("heading", { name: "A 股市场与行业研究" }),
  ).toBeVisible();
  await expect(page.getByText(/不构成任何投资建议/)).toBeVisible();

  await page.goto("/archive/");
  await expect(page.locator(".archive-card")).toHaveCount(
    archive.entries.length,
  );

  await page.goto("/favorites/");
  await expect(
    page.getByText(articleTitle ?? "", { exact: true }).first(),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON" }).click();
  await downloadPromise;
});

test("mobile viewport has bottom navigation and no horizontal overflow", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile-only assertion");
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "手机主导航" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
