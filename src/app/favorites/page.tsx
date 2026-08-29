import type { Metadata } from "next";
import { FavoritesCenter } from "@/components/favorites-center";
export const metadata: Metadata = { title: "收藏中心" };
export default function FavoritesPage() {
  return (
    <>
      <header className="page-hero">
        <div>
          <span className="eyebrow">Local Knowledge Base</span>
          <h1>收藏中心</h1>
          <p>
            按类型、标签、日期和备注检索；支持 JSON 完整备份、Markdown
            导出与恢复。数据默认只在当前浏览器。
          </p>
        </div>
      </header>
      <FavoritesCenter />
    </>
  );
}
