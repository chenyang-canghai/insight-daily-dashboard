import type { DailyDigest } from "@/types/content";

export type SearchType =
  "新闻" | "深度分析" | "行业" | "个股研究" | "行测题" | "申论";

export interface SearchRecord {
  id: string;
  type: SearchType;
  title: string;
  text: string;
  date: string;
  tags: string[];
  href: string;
}

export function buildSearchRecords(digests: DailyDigest[]): SearchRecord[] {
  return digests.flatMap((digest) => {
    const news = digest.news.map((item) => ({
      id: item.id,
      type: "新闻" as const,
      title: item.title,
      text: `${item.summary} ${item.why_it_matters}`,
      date: item.date,
      tags: item.tags,
      href: `/news/${item.id}/`,
    }));
    const deep = digest.deep_dives.map((item) => ({
      id: item.id,
      type: "深度分析" as const,
      title: item.title,
      text: `${item.one_sentence} ${item.background} ${item.mechanism}`,
      date: item.date,
      tags: [item.shenlun_material.theme],
      href: `/news/${item.news_ids[0]}/#deep-dive`,
    }));
    const sectors = digest.market.sectors.map((item, index) => ({
      id: `sector-${digest.date}-${index}`,
      type: "行业" as const,
      title: item.name,
      text: `${item.catalyst} ${item.sustainability} ${item.risk}`,
      date: digest.date,
      tags: item.chain,
      href: `/market/#sectors`,
    }));
    const candidate = [
      {
        id: `candidate-${digest.date}`,
        type: "个股研究" as const,
        title: digest.market.research_candidate.name,
        text: `${digest.market.research_candidate.business_model} ${digest.market.research_candidate.selection_reason} ${digest.market.research_candidate.risks.join(" ")}`,
        date: digest.date,
        tags: [digest.market.research_candidate.industry],
        href: `/market/#candidate`,
      },
    ];
    const questions = digest.exam.questions.map((item) => ({
      id: item.id,
      type: "行测题" as const,
      title: `${item.question_type}｜${item.stem.slice(0, 36)}`,
      text: `${item.stem} ${item.explanation}`,
      date: digest.date,
      tags: item.tags,
      href: `/exam/#${item.id}`,
    }));
    const shenlun = digest.exam.shenlun.current_affairs.map((item, index) => ({
      id: `shenlun-${digest.date}-${index}`,
      type: "申论" as const,
      title: item.title,
      text: `${item.event_summary} ${item.policy_background} ${item.arguments.join(" ")}`,
      date: digest.date,
      tags: [item.theme],
      href: `/exam/#shenlun`,
    }));
    return [
      ...news,
      ...deep,
      ...sectors,
      ...candidate,
      ...questions,
      ...shenlun,
    ];
  });
}

export function searchRecords(
  records: SearchRecord[],
  query: string,
  type?: string,
) {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  return records
    .filter((record) => !type || type === "全部" || record.type === type)
    .filter((record) => {
      if (!normalized) return true;
      return `${record.title} ${record.text} ${record.tags.join(" ")}`
        .toLocaleLowerCase("zh-CN")
        .includes(normalized);
    });
}
