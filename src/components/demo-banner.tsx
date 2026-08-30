import { FlaskConical } from "lucide-react";

export function DemoBanner({ isDemo }: { isDemo: boolean }) {
  const live = !isDemo;
  return (
    <aside
      className="demo-banner"
      aria-label={live ? "真实来源提示" : "演示数据提示"}
    >
      <FlaskConical size={17} aria-hidden="true" />
      <span>
        <strong>{live ? "真实来源模式" : "DEMO 模式"}</strong>　
        {live
          ? "内容由公开来源自动采集并结构化整理，请以原文链接为准；行情复盘不构成投资建议。"
          : "当前内容只用于展示结构与交互，不是实时新闻或真实行情，也不构成投资建议。"}
      </span>
    </aside>
  );
}
