"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const order: Theme[] = ["system", "light", "dark"];
const labels: Record<Theme, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("insight-theme") as Theme | null;
    const initial = order.includes(stored as Theme)
      ? (stored as Theme)
      : "system";
    const stateTimer = window.setTimeout(() => setTheme(initial), 0);
    applyTheme(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme(initial);
    media.addEventListener("change", update);
    return () => {
      window.clearTimeout(stateTimer);
      media.removeEventListener("change", update);
    };
  }, []);

  const cycle = () => {
    const next = order[(order.indexOf(theme) + 1) % order.length] ?? "system";
    setTheme(next);
    window.localStorage.setItem("insight-theme", next);
    applyTheme(next);
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;
  return (
    <button
      className="icon-button"
      type="button"
      onClick={cycle}
      aria-label={`主题：${labels[theme]}，点击切换`}
      title={`主题：${labels[theme]}`}
    >
      <Icon aria-hidden="true" size={18} />
    </button>
  );
}
