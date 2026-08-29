import type { Metadata } from "next";
import { DemoBanner } from "@/components/demo-banner";
import { ExamPractice } from "@/components/exam-practice";
import { WrongBook } from "@/components/wrong-book";
import { latestDigest } from "@/lib/data";

export const metadata: Metadata = { title: "公考学习" };
export default function ExamPage() {
  const exam = latestDigest.exam;
  const shenlun = exam.shenlun;
  return (
    <>
      <DemoBanner />
      <header className="page-hero">
        <div>
          <span className="eyebrow">国考 · 江西省考 · 06:45</span>
          <h1>公考学习</h1>
          <p>
            每天 8
            道原创行测题、申论时政积累和一题微练习；作答后才显示答案，错题按 1 /
            3 / 7 / 14 / 30 天复习。
          </p>
        </div>
      </header>
      <ExamPractice questions={exam.questions} />
      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Wrong Book</span>
            <h2>错题本与复习</h2>
          </div>
          <p>保存在当前浏览器 IndexedDB，不会提交到公开仓库。</p>
        </div>
        <WrongBook />
      </section>
      <section className="section" id="shenlun">
        <div className="section-header">
          <div>
            <span className="eyebrow">Shenlun</span>
            <h2>申论每日积累</h2>
          </div>
          <p>
            重点覆盖数字政府、数据要素、基层治理、乡村振兴、先进制造、绿色发展、营商环境、青年就业与江西发展。
          </p>
        </div>
        <div className="shenlun-grid">
          {shenlun.current_affairs.map((item) => (
            <article className="material-card" key={item.title}>
              <span className="category-label">{item.theme}</span>
              <h3>{item.title}</h3>
              <p>{item.event_summary}</p>
              <p>
                <b>政策背景：</b>
                {item.policy_background}
              </p>
              <ul>
                {item.arguments.map((argument) => (
                  <li key={argument}>{argument}</li>
                ))}
              </ul>
              <small>适用：{item.suitable_questions.join(" / ")}</small>
            </article>
          ))}
          <article className="material-card">
            <span className="category-label">规范表达</span>
            {shenlun.standard_expressions.map((item) => (
              <div className="expression-row" key={item.plain}>
                <span>{item.plain}</span>
                <b>→ {item.formal}</b>
                <p>{item.example}</p>
              </div>
            ))}
          </article>
          <article className="material-card">
            <span className="category-label">案例素材卡</span>
            <h3>{shenlun.case_material.name}</h3>
            <p>{shenlun.case_material.practice}</p>
            <p>
              <b>解决问题：</b>
              {shenlun.case_material.problem}
            </p>
            <p>
              <b>提炼：</b>
              {shenlun.case_material.lesson}
            </p>
            <p>
              <b>不可夸大：</b>
              {shenlun.case_material.limitation}
            </p>
          </article>
          <article className="material-card micro-practice">
            <span className="category-label">
              {shenlun.micro_practice.type}
            </span>
            <h3>每日申论微练习</h3>
            <p>{shenlun.micro_practice.material}</p>
            <p>
              <b>要求：</b>
              {shenlun.micro_practice.requirement}（
              {shenlun.micro_practice.word_limit} 字）
            </p>
            <textarea
              aria-label="申论答题框"
              rows={10}
              style={{ width: "100%", padding: 12 }}
              placeholder="在此作答；当前内容仅保存在输入框，不上传。"
            />
            <details className="answer-details">
              <summary>完成后查看参考答案与评分点</summary>
              <div>
                <p>{shenlun.micro_practice.reference_answer}</p>
                <p>
                  <b>评分点：</b>
                  {shenlun.micro_practice.scoring_points.join("、")}
                </p>
                <p>
                  <b>常见失分：</b>
                  {shenlun.micro_practice.common_mistakes.join("、")}
                </p>
                <p>
                  <b>优秀表达：</b>
                  {shenlun.micro_practice.strong_expressions.join("；")}
                </p>
              </div>
            </details>
          </article>
        </div>
      </section>
    </>
  );
}
