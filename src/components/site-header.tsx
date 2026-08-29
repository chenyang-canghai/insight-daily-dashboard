"use client";

import { Bookmark, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderAccountMenu } from "@/components/header-account-menu";

const nav = [
  ["编辑部晨报", "/"],
  ["公考学习", "/exam/"],
  ["研判库", "/news/"],
  ["历史归档", "/archive/"],
] as const;

function beijingTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-")
    .replace(/星期/, "周")
    .replace(/(周.)\s*/, " ($1) ");
}

export function SiteHeader() {
  const pathname = usePathname();
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
            <Link
              key={href}
              href={href}
              className={
                href === "/"
                  ? pathname === "/"
                    ? "active"
                    : undefined
                  : pathname.startsWith(href)
                    ? "active"
                    : undefined
              }
              aria-current={
                (href === "/" && pathname === "/") ||
                (href !== "/" && pathname.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <span className="beijing-clock" aria-label={`北京时间 ${now}`}>
            {now ? `${now} 北京时间` : "北京时间"}
          </span>
          <Link className="icon-button" href="/search/" aria-label="全局搜索">
            <Search size={22} />
          </Link>
          <Link
            className="icon-button hide-mobile"
            href="/favorites/"
            aria-label="收藏中心"
          >
            <Bookmark size={22} />
          </Link>
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  );
}
