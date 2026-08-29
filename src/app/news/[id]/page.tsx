import { ArrowLeft, Clock3, ExternalLink, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBanner } from "@/components/demo-banner";
import { FavoriteButton } from "@/components/favorite-button";
import { ImpactChain } from "@/components/impact-chain";
import { getAllNews, getNewsItem } from "@/lib/data";
import { formatBeijingDate } from "@/lib/utils";

export const dynamicParams = false;
export function generateStaticParams() {
  return getAllNews().map((item) => ({ id: item.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = getNewsItem(id);
  return { title: found?.item.title ?? "新闻详情" };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const found = getNewsItem(id);
  if (!found) notFound();
  const { item, deepDive, digest } = found;
  return (
    <>
      <DemoBanner />
      <div className="page-hero">
        <Link className="text-link" href="/news/">
          <ArrowLeft size={15} />
          返回新闻列表
        </Link>
      </div>
      <div className="article-layout">
        <article className="article">
          <span className="category-label">{item.category}</span>
          <h1>{item.title}</h1>
          <div className="source-line">
            <span>
              <Clock3 size={14} />
              {formatBeijingDate(item.published_at, true)}
            </span>
            <span>预计阅读 {item.reading_minutes} 分钟</span>
            <span>可靠性 {item.reliability}</span>
          </div>
          <p className="article-lead">{item.summary}</p>
          <div className="page-actions">
            <FavoriteButton
              contentId={item.id}
              type="新闻"
              title={item.title}
              excerpt={item.summary}
              date={item.date}
              tags={item.tags}
              source={item.source_name}
              sourceUrl={item.source_url}
            />
          </div>
          <div className="article-section">
            <h2>为什么值得关注</h2>
            <p>{item.why_it_matters}</p>
            <h3>事实与推断分开</h3>
            <ul>
              {item.facts.map((fact) => (
                <li key={fact}>已确认/演示声明：{fact}</li>
              ))}
              {item.inferences.map((inference) => (
                <li key={inference}>推断边界：{inference}</li>
              ))}
            </ul>
          </div>
          {deepDive && (
            <section className="article-section" id="deep-dive">
              <span className="eyebrow">Deep Dive</span>
              <h2>{deepDive.one_sentence}</h2>
              <p>{deepDive.background}</p>
              <h3>背景与时间线</h3>
              <div className="timeline">
                {deepDive.timeline.map((entry) => (
                  <div className="timeline-item" key={entry.time}>
                    <b>{entry.time}</b>
                    <span>{entry.label}</span>
                  </div>
                ))}
              </div>
              <h3>运行机制</h3>
              <p>{deepDive.mechanism}</p>
              <ImpactChain items={deepDive.impact_chain} />
              <h3>时间维度</h3>
              <ul>
                <li>
                  <b>短期：</b>
                  {deepDive.short_term}
                </li>
                <li>
                  <b>中期：</b>
                  {deepDive.medium_term}
                </li>
                <li>
                  <b>长期：</b>
                  {deepDive.long_term}
                </li>
              </ul>
              <h3>谁可能受益，谁可能承压</h3>
              <p>
                <b>潜在受益：</b>
                {deepDive.beneficiaries.join("；")}
              </p>
              <p>
                <b>潜在承压：</b>
                {deepDive.pressured_groups.join("；")}
              </p>
              <h3>仍然不知道什么</h3>
              <ul>
                {deepDive.unknowns.map((unknown) => (
                  <li key={unknown}>{unknown}</li>
                ))}
              </ul>
              <h3>申论素材转化</h3>
              <p>
                <b>主题：</b>
                {deepDive.shenlun_material.theme}
              </p>
              <p>
                <b>规范表达：</b>
                {deepDive.shenlun_material.expressions.join("；")}
              </p>
              <p>
                <b>论证角度：</b>
                {deepDive.shenlun_material.argument}
              </p>
            </section>
          )}
        </article>
        <aside className="article-aside">
          <div className="aside-card">
            <h3>来源与追溯</h3>
            {item.citations.map((citation) => (
              <p key={citation.source_id}>
                <a
                  className="text-link"
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {citation.source_name}
                  <ExternalLink size={12} />
                </a>
                <br />
                {citation.note}
              </p>
            ))}
          </div>
          <div className="aside-card">
            <h3>
              <ShieldQuestion size={14} /> 分析边界
            </h3>
            <p>置信度：{deepDive?.confidence ?? "未生成"}</p>
            <p>日报日期：{digest.date}</p>
            <p>
              {item.is_demo
                ? "所有 demo 信息不可作为现实事实引用。"
                : "结构化摘要不代替原文，具体事实、数字与适用范围请回到引用来源核验。"}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
