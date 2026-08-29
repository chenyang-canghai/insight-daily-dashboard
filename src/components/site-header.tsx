"use client";

import { Bookmark, CalendarDays, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  ["首页", "/"],
  ["全球研判", "/news/"],
  ["A 股复盘", "/market/"],
  ["公考学习", "/exam/"],
  ["历史归档", "/archive/"],
] as const;

function beijingTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function SiteHeader() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const update = () => setNow(beijingTime(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="知势首页">
          <span className="brand-mark" aria-hidden="true">
            知
          </span>
          <span>
            <strong>知势</strong>
            <small>Insight Daily</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="主导航">
          {nav.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <span className="beijing-clock" aria-label={`北京时间 ${now}`}>
            <CalendarDays size={15} aria-hidden="true" />
            {now || "北京时间"}
          </span>
          <Link className="icon-button" href="/search/" aria-label="全局搜索">
            <Search size={18} />
          </Link>
          <Link
            className="icon-button hide-mobile"
            href="/favorites/"
            aria-label="收藏中心"
          >
            <Bookmark size={18} />
          </Link>
          <Link
            className="icon-button hide-mobile"
            href="/settings/"
            aria-label="设置"
          >
            <Settings size={18} />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
