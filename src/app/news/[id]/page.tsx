import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldQuestion,
} from "lucide-react";
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
  const evidenceLevel =
    item.evidence_level ??
    (item.facts.length > 1 ? "official_summary" : "metadata_only");
  const hasEvidence = item.is_demo || evidenceLevel !== "metadata_only";
  const evidenceLabel =
    evidenceLevel === "official_page"
      ? "官方正文摘录"
      : evidenceLevel === "official_summary"
        ? "官方摘要"
        : "仅标题元数据";
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
          <section className="article-section evidence-section">
            <span className="eyebrow">先看证据</span>
            <h2>目前能确认什么</h2>
            <div className="fact-list">
              {item.facts.map((fact) => (
                <div className="fact-item" key={fact}>
                  <CheckCircle2 aria-hidden="true" size={17} />
                  <p>{fact}</p>
                </div>
              ))}
            </div>
            <h3>为什么值得关注</h3>
            <p>{item.why_it_matters}</p>
            <div className="boundary-note">
              <AlertTriangle aria-hidden="true" size={17} />
              <div>
                <b>分析边界</b>
                {item.inferences.map((inference) => (
                  <p key={inference}>{inference}</p>
                ))}
              </div>
            </div>
          </section>
          {deepDive && hasEvidence ? (
            <section className="article-section" id="deep-dive">
              <span className="eyebrow">基于已核验材料</span>
              <h2>核心判断</h2>
              <p className="analysis-conclusion">{deepDive.one_sentence}</p>
              <h3>1. 证据怎样支持判断</h3>
              <p>{deepDive.background}</p>
              <h3>2. 可能怎样传导</h3>
              <p className="analysis-label">以下是分析框架，不是已发生事实</p>
              <p>{deepDive.mechanism}</p>
              <ImpactChain items={deepDive.impact_chain} />
              <h3>3. 接下来查什么</h3>
              <ul className="question-list">
                {deepDive.unknowns.map((unknown) => (
                  <li key={unknown}>{unknown}</li>
                ))}
              </ul>
              <h3>4. 申论怎么用</h3>
              <p className="shenlun-argument">
                <b>论证角度：</b>
                {deepDive.shenlun_material.argument}
              </p>
              <div className="expression-list" aria-label="申论规范表达">
                {deepDive.shenlun_material.expressions.map((expression) => (
                  <span key={expression}>{expression}</span>
                ))}
              </div>
            </section>
          ) : (
            <section className="article-section insufficient-evidence">
              <AlertTriangle aria-hidden="true" size={20} />
              <div>
                <h2>正文证据不足，暂不做深度剖析</h2>
                <p>
                  当前只核验到标题、来源和发布时间。为了避免把通用模板伪装成新闻结论，本页不扩写机制、受益者和长期影响。
                </p>
                <a
                  className="text-link"
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  打开官方原文继续核验
                  <ExternalLink size={13} />
                </a>
              </div>
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
            <p>证据层级：{evidenceLabel}</p>
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
