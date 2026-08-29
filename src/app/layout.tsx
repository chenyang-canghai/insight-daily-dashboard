import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: { default: "知势 · 每日研判与公考学习看板", template: "%s｜知势" },
  description:
    "面向数字经济研究生的新闻研判、A 股复盘与国考/江西省考学习看板。",
  applicationName: "知势",
  manifest: `${basePath}/manifest.webmanifest`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1210" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          跳到主要内容
        </a>
        <SiteHeader />
        <main id="main-content" className="page-shell">
          {children}
        </main>
        <SiteFooter />
        <MobileNav />
      </body>
    </html>
  );
}
