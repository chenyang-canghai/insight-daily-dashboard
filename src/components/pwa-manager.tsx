"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "insight-pwa-install-dismissed-v1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function PwaManager() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const navigatorWithStandalone = navigator as Navigator & {
        standalone?: boolean;
      };
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigatorWithStandalone.standalone === true;
      setInstalled(standalone);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    }, 0);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${basePath}/sw.js`, {
          scope: `${basePath || ""}/`,
          updateViaCache: "none",
        })
        .then((registration) => registration.update())
        .catch((error: unknown) => {
          console.warn("PWA service worker registration failed", error);
        });
    }

    return () => {
      window.clearTimeout(initialize);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "dismissed") dismiss();
  };

  if (installed || dismissed || (!prompt && !isIOS)) return null;

  return (
    <aside className="pwa-install-banner" aria-live="polite">
      <span className="pwa-install-icon" aria-hidden="true">
        知
      </span>
      <div>
        <b>安装“知势”到手机桌面</b>
        <p>
          {isIOS
            ? "在 Safari 点“分享”，再选择“添加到主屏幕”。"
            : "像 App 一样独立打开，并可阅读已缓存的页面。"}
        </p>
      </div>
      <div className="pwa-install-actions">
        {prompt ? (
          <button className="primary-button" type="button" onClick={install}>
            <Download size={15} aria-hidden="true" />
            安装
          </button>
        ) : (
          <span className="pwa-ios-hint">
            <Share2 size={15} aria-hidden="true" /> Safari 分享
          </span>
        )}
        <button
          className="icon-button"
          type="button"
          onClick={dismiss}
          aria-label="关闭安装提示"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
