import archiveJson from "../../data/manifests/archive-index.json";
import {
  generatedDigestDates,
  generatedDigests,
} from "../../data/manifests/digests.generated";
import latestJson from "../../data/manifests/latest.json";
import type {
  ArchiveIndex,
  DailyDigest,
  DeepDive,
  NewsItem,
} from "@/types/content";

export const latestDigest = latestJson as unknown as DailyDigest;
export const archiveIndex = archiveJson as unknown as ArchiveIndex;
export const allDigests = [...generatedDigests] as unknown as DailyDigest[];

const archiveDates = archiveIndex.entries.map((entry) => entry.date);
if (
  generatedDigestDates.length !== archiveDates.length ||
  generatedDigestDates.some((date, index) => date !== archiveDates[index]) ||
  !generatedDigestDates.some((date) => date === latestDigest.date)
) {
  throw new Error(
    "Generated digest imports are stale. Run scripts/build_public_data.py before building.",
  );
}

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
