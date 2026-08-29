"use client";

import { Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function HeaderAccountMenu() {
  return (
    <details className="header-account-menu">
      <summary className="icon-button" aria-label="打开个人设置">
        <UserRound size={22} aria-hidden="true" />
      </summary>
      <div className="header-account-popover">
        <Link href="/settings/">
          <Settings size={17} aria-hidden="true" />
          设置与隐私
        </Link>
        <div className="header-theme-row">
          <span>切换主题</span>
          <ThemeToggle />
        </div>
      </div>
    </details>
  );
}
