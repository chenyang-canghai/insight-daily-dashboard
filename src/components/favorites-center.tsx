"use client";

import {
  Download,
  FileJson,
  FileText,
  Pin,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearUserData,
  exportUserData,
  importUserData,
  listFavorites,
  removeFavorite,
  saveFavorite,
} from "@/lib/db";
import { safeFilename } from "@/lib/utils";
import type { FavoriteRecord, UserDataExport } from "@/types/user-data";

const types = [
  "全部",
  "新闻",
  "深度分析",
  "行业",
  "个股研究",
  "行测题",
  "申论素材",
  "金句",
  "案例",
  "自定义笔记",
];

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FavoritesCenter() {
  const [items, setItems] = useState<FavoriteRecord[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = () =>
    listFavorites().then((records) =>
      setItems(
        records.sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            b.updatedAt.localeCompare(a.updatedAt),
        ),
      ),
    );
  useEffect(() => {
    refresh().catch(() => setNotice("无法读取当前浏览器的 IndexedDB。"));
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (type === "全部" || item.type === type) &&
          (!query ||
            `${item.title} ${item.excerpt} ${item.note} ${item.tags.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [items, query, type],
  );

  const update = async (
    item: FavoriteRecord,
    patch: Partial<FavoriteRecord>,
  ) => {
    await saveFavorite({
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    await refresh();
  };

  const exportJson = async () => {
    const data = await exportUserData();
    download(
      `知势-个人数据-${safeFilename(new Date().toISOString().slice(0, 10))}.json`,
      JSON.stringify(data, null, 2),
      "application/json",
    );
  };

  const exportMarkdown = () => {
    const body = filtered
      .flatMap((item) => [
        `## ${item.title}`,
        "",
        `- 类型：${item.type}`,
        `- 日期：${item.date}`,
        `- 标签：${item.tags.join("、") || "无"}`,
        `- 备注：${item.note || "无"}`,
        "",
        item.excerpt,
        "",
      ])
      .join("\n");
    download(
      `知势-收藏-${new Date().toISOString().slice(0, 10)}.md`,
      `# 知势收藏导出\n\n${body}`,
      "text/markdown",
    );
  };

  const importFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) throw new Error("文件超过 2 MB 限制");
    const data = JSON.parse(await file.text()) as UserDataExport;
    await importUserData(data);
    await refresh();
    setNotice("导入完成；同 ID 内容已更新。请核对条目。 ");
  };

  const clear = async () => {
    if (
      !window.confirm(
        "将清空收藏、答题记录和错题本。请确认已导出备份。是否继续？",
      )
    )
      return;
    if (
      !window.confirm("最后确认：此操作无法撤销。确定清空当前浏览器个人数据？")
    )
      return;
    await clearUserData();
    await refresh();
    setNotice("当前浏览器个人数据已清空。 ");
  };

  return (
    <section className="favorites-center">
      <div className="favorites-toolbar">
        <div className="search-input-wrap compact">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、标签、备注"
            aria-label="搜索收藏"
          />
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={exportJson}
          >
            <FileJson size={16} />
            导出 JSON
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={exportMarkdown}
          >
            <FileText size={16} />
            导出 Markdown
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            恢复备份
          </button>
          <input
            ref={fileInput}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                importFile(file).catch((error: unknown) =>
                  setNotice(
                    error instanceof Error ? error.message : "导入失败",
                  ),
                );
            }}
          />
        </div>
      </div>
      <div className="filter-chips">
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
      {notice && (
        <p className="inline-notice" role="status">
          {notice}
        </p>
      )}
      <div className="favorites-summary">
        <span>当前筛选 {filtered.length} 条</span>
        <button className="danger-link" type="button" onClick={clear}>
          <Trash2 size={15} />
          清空个人数据
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Download size={28} />
          <h2>还没有匹配的收藏</h2>
          <p>
            从新闻、深度分析、题目或申论素材卡片点击“收藏”，数据会保存在当前浏览器。
          </p>
        </div>
      ) : (
        <div className="favorite-list">
          {filtered.map((item) => (
            <article className="favorite-record" key={item.id}>
              <div className="favorite-record-head">
                <span className="category-label">{item.type}</span>
                <button
                  type="button"
                  className={item.pinned ? "pin-button active" : "pin-button"}
                  onClick={() => update(item, { pinned: !item.pinned })}
                  aria-label={item.pinned ? "取消置顶" : "置顶"}
                >
                  <Pin size={16} />
                </button>
              </div>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <label>
                自定义标签
                <input
                  value={item.tags.join(", ")}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((record) =>
                        record.id === item.id
                          ? {
                              ...record,
                              tags: event.target.value
                                .split(/[,，]/)
                                .map((tag) => tag.trim())
                                .filter(Boolean),
                            }
                          : record,
                      ),
                    )
                  }
                  onBlur={() => update(item, { tags: item.tags })}
                />
              </label>
              <label>
                收藏备注
                <textarea
                  value={item.note}
                  rows={2}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((record) =>
                        record.id === item.id
                          ? { ...record, note: event.target.value }
                          : record,
                      ),
                    )
                  }
                  onBlur={() => update(item, { note: item.note })}
                />
              </label>
              <div className="favorite-record-footer">
                <span>
                  {item.date} · {item.source ?? "个人内容"}
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => update(item, { mastered: !item.mastered })}
                  >
                    {item.mastered ? "已掌握" : "标记掌握"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeFavorite(item.id);
                      await refresh();
                    }}
                  >
                    <Trash2 size={14} />
                    移除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
