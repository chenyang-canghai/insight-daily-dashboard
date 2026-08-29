import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <aside className="demo-banner" aria-label="演示数据提示">
      <FlaskConical size={17} aria-hidden="true" />
      <span>
        <strong>DEMO 模式</strong>
        　当前内容只用于展示结构与交互，不是实时新闻或真实行情，也不构成投资建议。
      </span>
    </aside>
  );
}
