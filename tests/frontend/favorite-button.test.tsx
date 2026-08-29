import { fireEvent, render, screen } from "@testing-library/react";
import { deleteDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import { FavoriteButton } from "@/components/favorite-button";
import { resetDBForTests } from "@/lib/db";

describe("FavoriteButton", () => {
  beforeEach(async () => {
    await resetDBForTests();
    await deleteDB("insight-daily-dashboard");
    await resetDBForTests();
  });
  it("adds and removes a favorite", async () => {
    render(
      <FavoriteButton
        contentId="n1"
        type="新闻"
        title="标题"
        excerpt="摘要"
        date="2026-08-29"
      />,
    );
    const add = await screen.findByRole("button", { name: "收藏" });
    fireEvent.click(add);
    expect(
      await screen.findByRole("button", { name: "取消收藏" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "取消收藏" }));
    expect(
      await screen.findByRole("button", { name: "收藏" }),
    ).toBeInTheDocument();
  });
});
