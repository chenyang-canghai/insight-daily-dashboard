import type { Metadata } from "next";
export const metadata: Metadata = { title: "设置与默认配置" };
const rows = [
  ["用户身份", "数字经济专业研究生"],
  ["目标考试", "国考、江西省考"],
  ["目标城市", "江西南昌"],
  ["新闻 / 深度 / 行测", "8 条 / 3 条 / 8 题"],
  ["新闻更新时间", "北京时间 07:15"],
  ["公考更新时间", "北京时间 06:45"],
  ["A 股更新时间", "交易日北京时间 18:25"],
  ["部署", "GitHub Pages"],
  ["公共存储", "GitHub 仓库 JSON + Markdown"],
  ["个人存储", "IndexedDB（收藏、错题、答题记录）"],
];
export default function SettingsPage() {
  return (
    <>
      <header className="page-hero">
        <div>
          <span className="eyebrow">Preferences & Privacy</span>
          <h1>设置与默认配置</h1>
          <p>
            当前版本以你的个人配置为默认值。主题可在右上角切换为跟随系统、浅色或深色。
          </p>
        </div>
      </header>
      <div className="settings-grid">
        <article className="setting-card">
          <h2>个人目标</h2>
          <ul className="setting-list">
            {rows.map(([key, value]) => (
              <li key={key}>
                <span>{key}</span>
                <b>{value}</b>
              </li>
            ))}
          </ul>
        </article>
        <article className="setting-card">
          <h2>隐私与跨设备</h2>
          <p>
            收藏和学习记录不会自动上传。手机与电脑是两个独立浏览器存储，需要在收藏中心导出
            JSON，再在另一台设备恢复。
          </p>
          <p>
            第二阶段可以配置 Supabase 登录与 RLS 同步；前端只能使用 anon
            key，service role key 永不进入浏览器。
          </p>
        </article>
        <article className="setting-card">
          <h2>内容边界</h2>
          <p>
            新闻不存付费全文；重大事实优先使用原始来源并尽量双源核验。题库只接入官方或已授权内容。股票模块不接账户、不下单、不输出确定性预测。
          </p>
        </article>
        <article className="setting-card">
          <h2>手机端</h2>
          <p>
            360px 起支持单列阅读、底部主导航、横向影响链与 44px 触控目标。建议将
            GitHub Pages 添加到手机桌面，获得接近应用的打开方式。
          </p>
        </article>
      </div>
    </>
  );
}
