import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { archiveIndex } from "@/lib/data";
export const metadata: Metadata = { title: "历史归档" };
export default function ArchivePage() {
  const demoCount = archiveIndex.entries.filter(
    (entry) => entry.mode === "demo",
  ).length;
  return (
    <>
      <DemoBanner />
      <header className="page-hero">
        <div>
          <span className="eyebrow">Archive</span>
          <h1>每日历史归档</h1>
          <p>
            按日浏览新闻、市场复盘、研究标的、行测练习和申论积累。当前提供
            {archiveIndex.entries.length} 天完整归档，其中 {demoCount}{" "}
            天为演示数据。
          </p>
        </div>
      </header>
      <section className="archive-list">
        {archiveIndex.entries.map((entry) => (
          <Link className="archive-card" href={entry.path} key={entry.date}>
            <span className="archive-date">{entry.date}</span>
            <h2>{entry.title}</h2>
            <div className="archive-stats">
              <div>
                <strong>{entry.news_count}</strong>
                <small>新闻</small>
              </div>
              <div>
                <strong>{entry.deep_dive_count}</strong>
                <small>剖析</small>
              </div>
              <div>
                <strong>{entry.question_count}</strong>
                <small>行测</small>
              </div>
            </div>
            <p className="section-link">
              打开综合日报 <ArrowRight size={14} />
            </p>
          </Link>
        ))}
      </section>
    </>
  );
}
