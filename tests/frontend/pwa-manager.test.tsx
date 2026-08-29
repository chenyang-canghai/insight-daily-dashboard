import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PwaManager } from "@/components/pwa-manager";

describe("PwaManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("offers the browser install prompt when available", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    render(<PwaManager />);
    await waitFor(() =>
      expect(window.localStorage.getItem("unrelated")).toBeNull(),
    );
    fireEvent(window, event);
    fireEvent.click(await screen.findByRole("button", { name: "安装" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
  });
});
