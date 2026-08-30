import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoBanner } from "@/components/demo-banner";
import { NewsCard } from "@/components/news-card";
import { allDigests, getDigest } from "@/lib/data";
export const dynamicParams = false;
export function generateStaticParams() {
  return allDigests.map((digest) => ({ date: digest.date }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return { title: `${date} 综合日报` };
}
export default async function DailyPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const digest = getDigest(date);
  if (!digest) notFound();
  return (
    <>
      <DemoBanner isDemo={digest.is_demo} />
      <header className="page-hero">
        <div>
          <span className="eyebrow">Daily Archive</span>
          <h1>{date} 综合日报</h1>
          <p>{digest.overview}</p>
        </div>
      </header>
      <section className="section">
        <div className="section-header">
          <div>
            <h2>当日新闻</h2>
          </div>
          <p>
            {digest.news.length} 条议题 · {digest.deep_dives.length} 条深度剖析
          </p>
        </div>
        <div className="news-grid">
          {digest.news.map((item) => (
            <NewsCard item={item} key={item.id} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="settings-grid">
          <article className="setting-card">
            <h2>市场复盘</h2>
            <p>{digest.market.status_note}</p>
            <ul className="setting-list">
              <li>
                <span>情绪</span>
                <b>{digest.market.sentiment}</b>
              </li>
              <li>
                <span>研究标的</span>
                <b>{digest.market.research_candidate.name}</b>
              </li>
              <li>
                <span>结论</span>
                <b>{digest.market.research_candidate.conclusion}</b>
              </li>
            </ul>
          </article>
          <article className="setting-card">
            <h2>公考学习</h2>
            <p>
              {digest.exam.questions.length} 道原创题，主题覆盖{" "}
              {Array.from(
                new Set(
                  digest.exam.questions.map((item) => item.question_type),
                ),
              ).join("、")}
              。
            </p>
            <ul className="setting-list">
              <li>
                <span>申论主题</span>
                <b>
                  {digest.exam.shenlun.current_affairs
                    .map((item) => item.theme)
                    .join("、")}
                </b>
              </li>
              <li>
                <span>微练习</span>
                <b>{digest.exam.shenlun.micro_practice.type}</b>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </>
  );
}
