"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { searchRecords, type SearchRecord } from "@/lib/search";

const types = [
  "全部",
  "新闻",
  "深度分析",
  "行业",
  "个股研究",
  "行测题",
  "申论",
];

export function SearchPanel({ records }: { records: SearchRecord[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部");
  const results = useMemo(
    () => searchRecords(records, query, type).slice(0, 80),
    [records, query, type],
  );

  return (
    <section className="search-panel">
      <div className="search-input-wrap">
        <Search size={20} />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索新闻、行业、股票代码、题目或申论主题"
          aria-label="全局搜索"
        />
      </div>
      <div className="filter-chips" aria-label="内容类型筛选">
        {types.map((item) => (
          <button
            type="button"
            className={type === item ? "active" : ""}
            key={item}
            onClick={() => setType(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="result-count">
        找到 {results.length} 条结果{!query && "（输入关键词可缩小范围）"}
      </p>
      <div className="search-results">
        {results.map((result) => (
          <Link
            href={result.href}
            key={`${result.date}-${result.id}`}
            className="search-result"
          >
            <span className="category-label">{result.type}</span>
            <div>
              <h3>{result.title}</h3>
              <p>{result.text.slice(0, 150)}</p>
              <small>
                {result.date} · {result.tags.slice(0, 3).join(" / ")}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
