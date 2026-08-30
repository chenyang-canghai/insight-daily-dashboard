import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { formatBeijingDate } from "@/lib/utils";
import type { NewsItem } from "@/types/content";

export function NewsCard({
  item,
  featured = false,
}: {
  item: NewsItem;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "news-card featured" : "news-card"}>
      <div className="card-meta-row">
        <div className="card-badge-row">
          <span className="category-label">{item.category}</span>
          <span
            className={`freshness-pill ${item.freshness === "follow_up" ? "follow-up" : "new"}`}
          >
            {item.freshness === "follow_up" ? "持续跟踪" : "本期新增"}
          </span>
        </div>
        <span className="score-pill">重要性 {item.importance_score}</span>
      </div>
      <Link href={`/news/${item.id}/`} className="news-title">
        <h3>{item.title}</h3>
      </Link>
      <p className="news-summary">{item.summary}</p>
      <div className="tag-row">
        {item.tags.slice(0, 4).map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <div className="news-card-footer">
        <div className="source-line">
          <span>
            <Clock3 size={14} />
            {formatBeijingDate(item.published_at, true)}
          </span>
          <span>
            <MapPin size={14} />
            {item.regions.join(" / ")}
          </span>
        </div>
        <div className="card-actions">
          <FavoriteButton
            compact
            contentId={item.id}
            type="新闻"
            title={item.title}
            excerpt={item.summary}
            date={item.date}
            tags={item.tags}
            source={item.source_name}
            sourceUrl={item.source_url}
          />
          <Link className="text-link" href={`/news/${item.id}/`}>
            阅读全文 <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
