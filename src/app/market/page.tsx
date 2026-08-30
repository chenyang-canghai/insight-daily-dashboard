import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { DemoBanner } from "@/components/demo-banner";
import { MarketChart } from "@/components/market-chart";
import { latestDigest } from "@/lib/data";
import { marketTone, signed } from "@/lib/utils";

export const metadata: Metadata = { title: "A 股市场复盘" };
export default function MarketPage() {
  const market = latestDigest.market;
  const total =
    (market.market_breadth.up ?? 0) +
      (market.market_breadth.down ?? 0) +
      (market.market_breadth.flat ?? 0) || 1;
  const candidate = market.research_candidate;
  return (
    <>
      <DemoBanner isDemo={latestDigest.is_demo} />
      <header className="page-hero">
        <div>
          <span className="eyebrow">A-Share · 交易日 18:25</span>
          <h1>A 股市场与行业研究</h1>
          <p>
            {market.status_note}{" "}
            红涨绿跌同时保留正负号，所有字段显示来源、单位、时间和质量状态。
          </p>
        </div>
        <span className="category-label">
          数据质量：{market.data_quality.status}
        </span>
      </header>
      <aside className="risk-disclaimer">
        <ShieldAlert size={15} />{" "}
        本内容仅用于学习、研究和信息整理，不构成任何投资建议，不提供买卖或仓位指令。
      </aside>
      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Major Indices</span>
            <h2>主要指数</h2>
          </div>
          <p>
            数据日期 {market.trading_date} · {market.indices[0]?.close.note}
          </p>
        </div>
        <div className="market-grid">
          {market.indices.map((item) => (
            <article className="index-card" key={item.code}>
              <div className="index-card-head">
                <div>
                  <h3>{item.name}</h3>
                  <small>{item.code}</small>
                </div>
                <span
                  className={`market-value ${marketTone(item.change_pct.value)}`}
                >
                  {signed(item.change_pct.value)}
                </span>
              </div>
              <div className="index-value">
                <strong>{item.close.value?.toLocaleString()}</strong>
                <small>{item.close.unit}</small>
              </div>
              <MarketChart
                values={item.trend}
                label={item.name}
                isDemo={market.is_demo}
              />
              <small>
                {item.turnover.value?.toLocaleString()} {item.turnover.unit} ·{" "}
                {item.close.source}
              </small>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="market-layout">
          <article className="data-card">
            <h3>市场广度与情绪</h3>
            <div className="breadth-bar">
              <span
                className="up"
                style={{
                  width: `${((market.market_breadth.up ?? 0) / total) * 100}%`,
                }}
              />
              <span
                className="flat"
                style={{
                  width: `${((market.market_breadth.flat ?? 0) / total) * 100}%`,
                }}
              />
              <span
                className="down"
                style={{
                  width: `${((market.market_breadth.down ?? 0) / total) * 100}%`,
                }}
              />
            </div>
            <div className="stat-row">
              <div>
                <small>上涨</small>
                <strong>{market.market_breadth.up}</strong>
              </div>
              <div>
                <small>下跌</small>
                <strong>{market.market_breadth.down}</strong>
              </div>
              <div>
                <small>中位数</small>
                <strong>
                  {signed(market.market_breadth.median_change_pct)}
                </strong>
              </div>
            </div>
            <h3 style={{ marginTop: 24 }}>情绪：{market.sentiment}</h3>
            <ul>
              {market.sentiment_basis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="data-card">
            <h3>数据质量</h3>
            <p>完整度：{Math.round(market.data_quality.completeness * 100)}%</p>
            <ul>
              {market.data_quality.notes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {market.data_quality.conflicts.length ? (
              <p>冲突：{market.data_quality.conflicts.join("；")}</p>
            ) : (
              <p>未记录来源冲突。</p>
            )}
          </article>
        </div>
      </section>
      <section className="section" id="sectors">
        <div className="section-header">
          <div>
            <span className="eyebrow">Sector Heat</span>
            <h2>行业热点</h2>
          </div>
          <p>
            热度不是推荐；持续性必须由上涨广度、成交、订单和基本面共同验证。
          </p>
        </div>
        <div className="sector-list">
          {market.sectors.map((sector) => (
            <article className="sector-row" key={sector.name}>
              <div>
                <h3>{sector.name}</h3>
                <p>{sector.catalyst}</p>
              </div>
              <div>
                <div className="heat-track">
                  <span style={{ width: `${sector.heat_score}%` }} />
                </div>
                <p>
                  持续性：{sector.sustainability} · 证伪：{sector.invalidation}
                </p>
              </div>
              <strong
                className={`market-value ${marketTone(sector.change_pct)}`}
              >
                {signed(sector.change_pct)}
              </strong>
            </article>
          ))}
        </div>
      </section>
      <section className="section" id="candidate">
        <div className="section-header">
          <div>
            <span className="eyebrow">Research Candidate</span>
            <h2>今日研究标的</h2>
          </div>
          <span className="category-label">{candidate.conclusion}</span>
        </div>
        <article className="article">
          <span className="score-pill">
            综合评分 {candidate.score ?? "—"} · {candidate.industry}
          </span>
          <h1>{candidate.name}</h1>
          <p className="article-lead">{candidate.selection_reason}</p>
          <div className="article-section">
            <h2>公司是谁</h2>
            <p>{candidate.business_model}</p>
            <h2>基本面</h2>
            <div className="settings-grid">
              {Object.entries(candidate.fundamentals).map(([key, value]) => (
                <div className="setting-card" key={key}>
                  <b>{key}</b>
                  <p>{value}</p>
                </div>
              ))}
            </div>
            <h2>估值与技术状态</h2>
            <div className="settings-grid">
              <div className="setting-card">
                <h3>估值</h3>
                {Object.entries(candidate.valuation).map(([key, value]) => (
                  <p key={key}>
                    <b>{key}：</b>
                    {value}
                  </p>
                ))}
              </div>
              <div className="setting-card">
                <h3>量价</h3>
                {Object.entries(candidate.technical_snapshot).map(
                  ([key, value]) => (
                    <p key={key}>
                      <b>{key}：</b>
                      {value}
                    </p>
                  ),
                )}
              </div>
            </div>
            <h2>催化与风险</h2>
            <div className="settings-grid">
              <div className="setting-card">
                <h3>潜在催化</h3>
                <ul>
                  {candidate.catalysts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="setting-card">
                <h3>至少五项风险</h3>
                <ul>
                  {candidate.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h2>三种情景与证伪</h2>
            <ul>
              <li>
                <b>乐观：</b>
                {candidate.scenarios.optimistic}
              </li>
              <li>
                <b>基准：</b>
                {candidate.scenarios.base}
              </li>
              <li>
                <b>悲观：</b>
                {candidate.scenarios.pessimistic}
              </li>
            </ul>
            <p>
              <b>证伪条件：</b>
              {candidate.invalidation_conditions.join("；")}
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
