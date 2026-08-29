import {
  ArrowRight,
  BookOpenCheck,
  ChartNoAxesCombined,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { ExamPractice } from "@/components/exam-practice";
import { MarketChart } from "@/components/market-chart";
import { NewsCard } from "@/components/news-card";
import { PersonalSnapshot } from "@/components/personal-snapshot";
import { StatusStrip } from "@/components/status-strip";
import { latestDigest } from "@/lib/data";
import { marketTone, signed } from "@/lib/utils";

export default function Home() {
  const { market, exam } = latestDigest;
  const breadthTotal =
    (market.market_breadth.up ?? 0) +
    (market.market_breadth.down ?? 0) +
    (market.market_breadth.flat ?? 0);
  return (
    <>
      <DemoBanner />
      <StatusStrip statuses={latestDigest.task_statuses} />

      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">{latestDigest.date} · 每日研判</span>
            <h1>
              看清变化的逻辑，
              <br />
              <em>积累判断的尺度。</em>
            </h1>
            <p className="hero-summary">{latestDigest.overview}</p>
            <div className="hero-actions">
              <Link
                className="primary-button"
                href={`/news/${latestDigest.news[0]?.id}/`}
              >
                开始今日研判 <ArrowRight size={17} />
              </Link>
              <Link className="secondary-button" href="/exam/">
                进入今日练习 <BookOpenCheck size={17} />
              </Link>
            </div>
          </div>
          <PersonalSnapshot />
        </div>
      </section>

      <section className="section" aria-labelledby="today-overview">
        <div className="section-header">
          <div>
            <span className="eyebrow">Daily Brief</span>
            <h2 id="today-overview">今日一屏总览</h2>
          </div>
          <p>先抓住最重要的信息，再决定往哪里深入。所有数字均为显式 demo。</p>
        </div>
        <div className="overview-grid">
          <Link
            href={`/news/${latestDigest.news[0]?.id}/`}
            className="overview-card primary"
          >
            <span className="card-kicker">今日最重要议题</span>
            <h3>{latestDigest.news[0]?.title}</h3>
            <p>{latestDigest.news[0]?.why_it_matters}</p>
            <div className="card-bottom">
              <span>重要性 {latestDigest.news[0]?.importance_score}</span>
              <span>阅读全文 →</span>
            </div>
          </Link>
          <Link href="/market/" className="overview-card">
            <span className="card-kicker">A 股市场温度</span>
            <h3>{market.sentiment} · DEMO</h3>
            <p>{market.status_note}</p>
            <div className="card-bottom">
              <span>最近交易日 {market.trading_date}</span>
              <ChartNoAxesCombined size={18} />
            </div>
          </Link>
          <Link href="/exam/" className="overview-card">
            <span className="card-kicker">今日公考计划</span>
            <h3>{exam.questions.length} 道行测 + 1 道申论</h3>
            <p>答案作答前隐藏，错题自动进入间隔复习。</p>
            <div className="card-bottom">
              <span>建议 25—35 分钟</span>
              <BookOpenCheck size={18} />
            </div>
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="news-heading">
        <div className="section-header">
          <div>
            <span className="eyebrow">Global Signals</span>
            <h2 id="news-heading">全球重点议题</h2>
          </div>
          <Link className="section-link" href="/news/">
            查看全部 8 条 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="news-grid">
          {latestDigest.news.slice(0, 4).map((item, index) => (
            <NewsCard key={item.id} item={item} featured={index === 0} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="deep-heading">
        <div className="section-header">
          <div>
            <span className="eyebrow">Deep Dive</span>
            <h2 id="deep-heading">三条逻辑链，而不是三段结论</h2>
          </div>
          <p>每条分析保留传导机制、时间维度、未知信息和证伪条件。</p>
        </div>
        <div className="deep-grid">
          {latestDigest.deep_dives.map((dive, index) => (
            <article className="deep-card" key={dive.id}>
              <span className="deep-card-number">0{index + 1} / 03</span>
              <h3>{dive.title}</h3>
              <p>{dive.one_sentence}</p>
              <div className="mini-chain">
                {dive.impact_chain.slice(0, 3).map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
              <Link
                className="text-link"
                href={`/news/${dive.news_ids[0]}/#deep-dive`}
              >
                展开分析 <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="market-heading">
        <div className="section-header">
          <div>
            <span className="eyebrow">A-Share Review</span>
            <h2 id="market-heading">A 股市场与行业观察</h2>
          </div>
          <Link className="section-link" href="/market/">
            完整市场复盘 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="market-layout">
          <div className="market-grid">
            {market.indices.map((item) => (
              <article className="index-card" key={item.code}>
                <div className="index-card-head">
                  <div>
                    <h3>{item.name}</h3>
                    <small>{item.code} · demo</small>
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
                <MarketChart values={item.trend} label={item.name} />
              </article>
            ))}
          </div>
          <div className="market-side">
            <article className="data-card">
              <h3>市场广度</h3>
              <div className="breadth-bar">
                <span
                  className="up"
                  style={{
                    width: `${((market.market_breadth.up ?? 0) / breadthTotal) * 100}%`,
                  }}
                />
                <span
                  className="flat"
                  style={{
                    width: `${((market.market_breadth.flat ?? 0) / breadthTotal) * 100}%`,
                  }}
                />
                <span
                  className="down"
                  style={{
                    width: `${((market.market_breadth.down ?? 0) / breadthTotal) * 100}%`,
                  }}
                />
              </div>
              <div className="stat-row">
                <div>
                  <small>上涨</small>
                  <strong className="market-value up">
                    {market.market_breadth.up}
                  </strong>
                </div>
                <div>
                  <small>平盘</small>
                  <strong>{market.market_breadth.flat}</strong>
                </div>
                <div>
                  <small>下跌</small>
                  <strong className="market-value down">
                    {market.market_breadth.down}
                  </strong>
                </div>
              </div>
            </article>
            <article className="data-card">
              <h3>今日研究标的</h3>
              <p>{market.research_candidate.name}</p>
              <p>{market.research_candidate.selection_reason}</p>
              <span className="category-label">
                {market.research_candidate.conclusion}
              </span>
            </article>
            <aside className="risk-disclaimer">
              <ShieldAlert size={15} />{" "}
              本内容仅用于学习、研究和信息整理，不构成任何投资建议。demo
              数值不可用于决策。
            </aside>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="practice-home">
        <div className="section-header">
          <div>
            <span className="eyebrow">Civil Service Exam</span>
            <h2 id="practice-home">今日行测</h2>
          </div>
          <p>每题记录答案、用时和信心；错误答案自动进入错题本。</p>
        </div>
        <ExamPractice questions={exam.questions} />
      </section>

      <section
        className="section"
        id="shenlun"
        aria-labelledby="shenlun-heading"
      >
        <div className="section-header">
          <div>
            <span className="eyebrow">Shenlun Notes</span>
            <h2 id="shenlun-heading">申论每日积累</h2>
          </div>
          <Link className="section-link" href="/exam/#shenlun">
            查看完整学习卡 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="shenlun-grid">
          {exam.shenlun.current_affairs.map((item) => (
            <article className="material-card" key={item.title}>
              <span className="category-label">{item.theme}</span>
              <h3>{item.title}</h3>
              <p>{item.event_summary}</p>
              <ul>
                {item.arguments.map((argument) => (
                  <li key={argument}>{argument}</li>
                ))}
              </ul>
            </article>
          ))}
          <article className="material-card micro-practice">
            <span className="category-label">
              每日微练习 · {exam.shenlun.micro_practice.type}
            </span>
            <h3>把问题概括成可执行的对策</h3>
            <p>{exam.shenlun.micro_practice.material}</p>
            <p>
              <b>要求：</b>
              {exam.shenlun.micro_practice.requirement} 字数上限{" "}
              {exam.shenlun.micro_practice.word_limit} 字。
            </p>
            <details className="answer-details">
              <summary>完成后查看参考答案</summary>
              <div>
                <p>{exam.shenlun.micro_practice.reference_answer}</p>
                <p>
                  评分点：
                  {exam.shenlun.micro_practice.scoring_points.join("、")}
                </p>
              </div>
            </details>
          </article>
          <article className="material-card">
            <span className="category-label">今日金句</span>
            {exam.shenlun.golden_sentences.map((item) => (
              <div className="expression-row" key={item.text}>
                <b>{item.type}</b>
                <p>{item.text}</p>
              </div>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
