import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { PwaManager } from "@/components/pwa-manager";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "知势",
  },
  icons: {
    icon: [
      {
        url: `${basePath}/icons/pwa-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${basePath}/icons/pwa-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `${basePath}/icons/apple-touch-icon.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b100e" },
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
        <PwaManager />
      </body>
    </html>
  );
}
