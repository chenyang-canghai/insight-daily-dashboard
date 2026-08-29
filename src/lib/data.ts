import archiveJson from "../../data/manifests/archive-index.json";
import latestJson from "../../data/manifests/latest.json";
import day27Json from "../../data/daily/2026/08/2026-08-27.json";
import day28Json from "../../data/daily/2026/08/2026-08-28.json";
import day29Json from "../../data/daily/2026/08/2026-08-29.json";
import type {
  ArchiveIndex,
  DailyDigest,
  DeepDive,
  NewsItem,
} from "@/types/content";

export const latestDigest = latestJson as unknown as DailyDigest;
export const archiveIndex = archiveJson as unknown as ArchiveIndex;
export const allDigests = [
  day29Json,
  day28Json,
  day27Json,
] as unknown as DailyDigest[];

export function getDigest(date: string) {
  return allDigests.find((digest) => digest.date === date);
}

export function getNewsItem(
  id: string,
): { item: NewsItem; digest: DailyDigest; deepDive?: DeepDive } | undefined {
  for (const digest of allDigests) {
    const item = digest.news.find((news) => news.id === id);
    if (item) {
      return {
        item,
        digest,
        deepDive: digest.deep_dives.find((dive) => dive.news_ids.includes(id)),
      };
    }
  }
}

export function getAllNews() {
  return allDigests.flatMap((digest) => digest.news);
}

export function getAllDeepDives() {
  return allDigests.flatMap((digest) => digest.deep_dives);
}
