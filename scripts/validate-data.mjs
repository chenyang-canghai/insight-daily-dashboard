import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (target) =>
  JSON.parse(await readFile(path.join(root, target), "utf8"));
const errors = [];
const forbidden = ["必涨", "稳赚", "百分百", "无风险", "内幕消息"];
const codePattern = /^\d{6}$/;

const archive = await readJson("data/manifests/archive-index.json");
if (!Array.isArray(archive.entries) || archive.entries.length < 3)
  errors.push("archive must contain at least three days");

for (const entry of archive.entries ?? []) {
  const [year, month] = entry.date.split("-");
  const digest = await readJson(
    `data/daily/${year}/${month}/${entry.date}.json`,
  );
  if (digest.news.length !== 8)
    errors.push(`${entry.date}: expected 8 news items`);
  if (digest.deep_dives.length !== 3)
    errors.push(`${entry.date}: expected 3 deep dives`);
  if (digest.exam.questions.length !== 8)
    errors.push(`${entry.date}: expected 8 questions`);
  const ids = digest.news.map((item) => item.id);
  if (new Set(ids).size !== ids.length)
    errors.push(`${entry.date}: duplicate news ids`);
  for (const item of digest.news) {
    if (!item.is_demo || item.generation_status !== "demo")
      errors.push(`${item.id}: demo flag missing`);
    if (!/^https:\/\//.test(item.source_url))
      errors.push(`${item.id}: source URL must use https`);
    if (item.importance_score < 0 || item.importance_score > 100)
      errors.push(`${item.id}: invalid importance score`);
  }
  for (const question of digest.exam.questions) {
    if (!Object.hasOwn(question.options, question.correct_answer))
      errors.push(`${question.id}: answer not found in options`);
    if (question.source_type !== "original_demo")
      errors.push(`${question.id}: unlicensed demo question source`);
  }
  const candidate = digest.market.research_candidate;
  if (!codePattern.test(candidate.code))
    errors.push(`${entry.date}: invalid candidate code format`);
  const text = JSON.stringify(digest);
  for (const word of forbidden)
    if (text.includes(word))
      errors.push(`${entry.date}: forbidden phrase ${word}`);
  if (
    digest.market.date === "2026-08-29" &&
    digest.market.trading_date === "2026-08-29"
  )
    errors.push(
      "weekend market data must not masquerade as same-day trading data",
    );
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${archive.entries.length} demo digests without errors.`);
