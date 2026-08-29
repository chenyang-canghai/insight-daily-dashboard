import type { Metadata } from "next";
import { DemoBanner } from "@/components/demo-banner";
import { NewsCard } from "@/components/news-card";
import { latestDigest } from "@/lib/data";

export const metadata: Metadata = { title: "全球重点新闻" };
export default function NewsPage() {
  return (
    <>
      <DemoBanner />
      <header className="page-hero">
        <div>
          <span className="eyebrow">Global Signals · 07:15</span>
          <h1>全球重点议题</h1>
          <p>
            默认关注宏观经济、人工智能、半导体、数字经济、国际时政和中国政策。正式运行时优先原始来源并执行交叉核验。
          </p>
        </div>
      </header>
      <div className="filter-chips">
        {[
          "全部",
          "宏观经济",
          "人工智能",
          "半导体",
          "数字经济",
          "中国政策",
          "国际时政",
          "江西发展",
        ].map((item, index) => (
          <span
            className={index === 0 ? "category-label" : "score-pill"}
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
      <section className="news-grid" aria-label="新闻列表">
        {latestDigest.news.map((item) => (
          <NewsCard item={item} key={item.id} />
        ))}
      </section>
    </>
  );
}
