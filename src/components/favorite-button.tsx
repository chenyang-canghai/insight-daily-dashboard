"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { getFavoriteByContent, removeFavorite, saveFavorite } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { FavoriteRecord, FavoriteType } from "@/types/user-data";

interface Props {
  contentId: string;
  type: FavoriteType;
  title: string;
  excerpt: string;
  date: string;
  tags?: string[];
  source?: string;
  sourceUrl?: string;
  compact?: boolean;
}

export function FavoriteButton(props: Props) {
  const [record, setRecord] = useState<FavoriteRecord | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getFavoriteByContent(props.contentId)
      .then(setRecord)
      .catch(() => undefined);
  }, [props.contentId]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (record) {
        await removeFavorite(record.id);
        setRecord(undefined);
      } else {
        const now = new Date().toISOString();
        const next: FavoriteRecord = {
          id: `fav-${props.contentId}`,
          contentId: props.contentId,
          type: props.type,
          title: props.title,
          excerpt: props.excerpt,
          source: props.source,
          sourceUrl: props.sourceUrl,
          date: props.date,
          tags: props.tags ?? [],
          category: props.type,
          note: "",
          mastered: false,
          pinned: false,
          createdAt: now,
          updatedAt: now,
        };
        await saveFavorite(next);
        setRecord(next);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "favorite-button",
        record && "active",
        props.compact && "compact",
      )}
      onClick={toggle}
      disabled={busy}
      aria-pressed={Boolean(record)}
      aria-label={record ? "取消收藏" : "收藏"}
    >
      <Bookmark size={16} fill={record ? "currentColor" : "none"} />
      {!props.compact && <span>{record ? "已收藏" : "收藏"}</span>}
    </button>
  );
}
