import { expect, test } from "@playwright/test";

test("browse, favorite, practice, market and archive", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("DEMO 模式")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /看清变化的逻辑/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: /开始今日研判/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "演示议题",
  );
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
  await expect(page.locator(".archive-card")).toHaveCount(3);

  await page.goto("/favorites/");
  await expect(page.getByText(/演示议题/).first()).toBeVisible();
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
