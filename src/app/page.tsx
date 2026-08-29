import {
  ArrowRight,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleCheckBig,
  CircleDot,
  NotebookTabs,
} from "lucide-react";
import Link from "next/link";
import { PersonalSnapshot } from "@/components/personal-snapshot";
import { latestDigest } from "@/lib/data";

function formatSignalTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("month")}-${read("day")} ${read("hour")}:${read("minute")}`;
}

export default function Home() {
  const { market, exam } = latestDigest;
  const lead = latestDigest.news[0];
  const signals = latestDigest.news.slice(0, 3);
  const newsStatus = latestDigest.task_statuses.find(
    (status) => status.module === "news",
  );
  const marketStatus = latestDigest.task_statuses.find(
    (status) => status.module === "market",
  );
  const examTopics = Array.from(
    new Set(exam.questions.slice(0, 3).map((item) => item.question_type)),
  ).join(" · ");
  const signalCategories = Array.from(
    new Set(signals.map((item) => item.category)),
  ).join("、");

  if (!lead) return null;

  return (
    <div className="editorial-home">
      <div className="editorial-layout">
        <div className="editorial-main">
          <div
            className="editorial-freshness"
            aria-label={latestDigest.is_demo ? "演示数据提示" : "真实来源提示"}
          >
            <span aria-hidden="true" />
            {latestDigest.is_demo ? "演示数据" : "真实来源"} ·{" "}
            {newsStatus?.scheduled_time ?? "07:15"} 更新
          </div>

          <section className="editorial-lead" aria-labelledby="today-judgment">
            <p className="editorial-label">今日判断</p>
            <h1 id="today-judgment">{lead.title}</h1>
            <p className="editorial-summary">
              今日重点覆盖{signalCategories}
              。先核对政策原文与数据口径，再观察执行进度、产业传导和就业影响，避免只凭标题下结论。
            </p>
            <div className="editorial-actions">
              <Link
                className="editorial-primary-action"
                href={`/news/${lead.id}/`}
              >
                开始今日研判 <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <ol className="editorial-workflow" aria-label="今日学习流程">
                <li className="active">
                  <CircleDot size={16} aria-hidden="true" />
                  <span>研判</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </li>
                <li>
                  <Circle size={14} aria-hidden="true" />
                  <span>训练</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </li>
                <li>
                  <Circle size={14} aria-hidden="true" />
                  <span>收盘复盘</span>
                </li>
              </ol>
            </div>
          </section>

          <section className="signal-section" aria-labelledby="signals-heading">
            <h2 id="signals-heading">三条重点信号</h2>
            <div className="signal-list">
              {signals.map((item, index) => (
                <article className="signal-row" key={item.id}>
                  <span className="signal-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="signal-content">
                    <div className="signal-title-line">
                      <Link href={`/news/${item.id}/`}>
                        <h3>{item.title}</h3>
                      </Link>
                      <span>{item.category}</span>
                    </div>
                    <p>{item.why_it_matters}</p>
                    <small>
                      {item.source_name}　{formatSignalTime(item.published_at)}
                    </small>
                  </div>
                  <Link
                    className="signal-arrow"
                    href={`/news/${item.id}/`}
                    aria-label={`阅读：${item.title}`}
                  >
                    <ChevronRight size={21} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <Link className="all-signals-link" href="/news/">
              查看全部信号（{latestDigest.news.length} 条）
              <ChevronDown size={18} aria-hidden="true" />
            </Link>
          </section>
        </div>

        <aside className="editorial-rail" aria-label="今日行动摘要">
          <section className="rail-block rail-next">
            <div className="rail-heading">
              <CircleCheckBig size={23} aria-hidden="true" />
              <h2>下一步</h2>
            </div>
            <h3>{exam.questions.length} 道行测 · 约 25 分钟</h3>
            <p>{examTopics || "判断推理 · 资料分析"}</p>
            <Link className="rail-primary-action" href="/exam/">
              开始训练 <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </section>

          <PersonalSnapshot />

          <section className="rail-block">
            <div className="rail-heading rail-heading-gold">
              <ChartNoAxesCombined size={22} aria-hidden="true" />
              <h2>
                A 股 ·{" "}
                {market.market_status === "closed" ? "非交易日" : "收盘复盘"}
              </h2>
            </div>
            <p>{market.status_note}</p>
            <Link className="rail-text-link" href="/market/">
              {marketStatus?.scheduled_time ?? "18:25"} 后查看复盘
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>

          <section className="rail-block rail-tip">
            <div className="rail-heading rail-heading-gold">
              <NotebookTabs size={22} aria-hidden="true" />
              <h2>今日提示</h2>
            </div>
            <p>
              先研判，把握方向；再训练，巩固方法；最后收盘复盘，形成长期能力。
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
