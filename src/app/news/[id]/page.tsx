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
      <DemoBanner isDemo={item.is_demo} />
      <div className="page-hero">
        <Link className="text-link" href="/news/">
          <ArrowLeft size={15} />
          返回新闻列表
        </Link>
      </div>
      <div className="article-layout">
        <article className="article">
          <div className="card-badge-row">
            <span className="category-label">{item.category}</span>
            <span
              className={`freshness-pill ${item.freshness === "follow_up" ? "follow-up" : "new"}`}
            >
              {item.freshness === "follow_up" ? "持续跟踪" : "本期新增"}
            </span>
          </div>
          <h1>{item.title}</h1>
          <div className="source-line">
            <span>
              <Clock3 size={14} />
              {formatBeijingDate(item.published_at, true)}
            </span>
            <span>预计阅读 {item.reading_minutes} 分钟</span>
            <span>可靠性 {item.reliability}</span>
            {item.first_seen_date && (
              <span>首次收录 {item.first_seen_date}</span>
            )}
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
                <li key={fact}>
                  {item.is_demo ? "演示声明" : "已确认事实"}：{fact}
                </li>
              ))}
              {item.inferences.map((inference) => (
                <li key={inference}>推断边界：{inference}</li>
              ))}
            </ul>
          </div>
          {deepDive && (
            <section className="article-section" id="deep-dive">
              <span className="eyebrow">逻辑拆解</span>
              <h2>一句话读懂</h2>
              <p className="analysis-conclusion">{deepDive.one_sentence}</p>
              <h3>第一步：确认事实边界</h3>
              <p>{deepDive.background}</p>
              <h3>第二步：按时间核验</h3>
              <div className="timeline">
                {deepDive.timeline.map((entry) => (
                  <div className="timeline-item" key={entry.time}>
                    <b>{entry.time}</b>
                    <span>{entry.label}</span>
                  </div>
                ))}
              </div>
              <h3>第三步：理解传导机制</h3>
              <p>{deepDive.mechanism}</p>
              <ImpactChain items={deepDive.impact_chain} />
              <h3>第四步：分阶段观察</h3>
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
              <h3>第五步：识别利益影响</h3>
              <p>
                <b>潜在受益：</b>
                {deepDive.beneficiaries.join("；")}
              </p>
              <p>
                <b>潜在承压：</b>
                {deepDive.pressured_groups.join("；")}
              </p>
              <h3>第六步：列出未知项</h3>
              <ul>
                {deepDive.unknowns.map((unknown) => (
                  <li key={unknown}>{unknown}</li>
                ))}
              </ul>
              <h3>第七步：转化为申论素材</h3>
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
