import type { Metadata } from "next";
import { SearchPanel } from "@/components/search-panel";
import { allDigests } from "@/lib/data";
import { buildSearchRecords } from "@/lib/search";
export const metadata: Metadata = { title: "全局搜索" };
export default function SearchPage() {
  return (
    <>
      <header className="page-hero">
        <div>
          <span className="eyebrow">Search</span>
          <h1>跨模块搜索</h1>
          <p>
            搜索新闻、深度分析、行业、研究标的、行测题、申论主题和案例素材。
          </p>
        </div>
      </header>
      <SearchPanel records={buildSearchRecords(allDigests)} />
    </>
  );
}
