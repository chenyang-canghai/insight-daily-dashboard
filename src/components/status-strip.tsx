import { CheckCircle2, Clock3 } from "lucide-react";
import type { TaskStatus } from "@/types/content";

const names = { news: "新闻", market: "A 股", exam: "公考" };

export function StatusStrip({ statuses }: { statuses: TaskStatus[] }) {
  return (
    <section className="status-strip" aria-label="自动任务状态">
      {statuses.map((status) => (
        <div className="status-item" key={status.module}>
          <span
            className={`status-dot ${status.freshness}`}
            aria-hidden="true"
          />
          <span>
            <b>{names[status.module]}</b>
            <small>{status.scheduled_time} 更新</small>
          </span>
          <span className="status-result">
            {status.freshness === "fresh" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Clock3 size={14} />
            )}
            {status.freshness === "demo"
              ? "演示就绪"
              : status.freshness === "fresh"
                ? "已更新"
                : "数据过期"}
          </span>
        </div>
      ))}
      <div className="status-item status-note">
        <Clock3 size={15} />
        <span>时区 Asia/Shanghai</span>
      </div>
    </section>
  );
}
