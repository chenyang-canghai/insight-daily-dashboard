import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const latest = JSON.parse(
  await readFile(path.join(root, "data/manifests/latest.json"), "utf8"),
);
const required = [
  `daily/${latest.date}/index.html`,
  ...latest.news.map((item) => `news/${item.id}/index.html`),
];
const missing = [];

for (const relativePath of required) {
  try {
    await access(path.join(root, "out", relativePath));
  } catch {
    missing.push(relativePath);
  }
}

if (missing.length) {
  console.error(
    `Static export is missing the latest routes:\n${missing.join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `Validated latest static routes: ${latest.date} daily page and ${latest.news.length} news pages.`,
);
