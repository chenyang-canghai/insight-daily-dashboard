import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(path.join(root, "public", "manifest.webmanifest"), "utf8"),
);
const errors = [];

if (
  manifest.start_url !== "./" ||
  manifest.scope !== "./" ||
  manifest.id !== "./"
) {
  errors.push("manifest URLs must remain relative for GitHub Pages basePath");
}
if (manifest.display !== "standalone") {
  errors.push("manifest display must be standalone");
}

const expected = new Map([
  ["icons/pwa-192.png", 192],
  ["icons/pwa-512.png", 512],
  ["icons/pwa-maskable-512.png", 512],
]);
for (const [source, size] of expected) {
  const icon = manifest.icons?.find((item) => item.src === source);
  if (!icon || !icon.sizes?.includes(`${size}x${size}`)) {
    errors.push(`missing manifest icon ${source}`);
    continue;
  }
  const buffer = await readFile(path.join(root, "public", source));
  if (
    buffer.readUInt32BE(16) !== size ||
    buffer.readUInt32BE(20) !== size ||
    buffer.subarray(1, 4).toString("ascii") !== "PNG"
  ) {
    errors.push(`${source} is not a ${size}x${size} PNG`);
  }
}

for (const file of ["sw.js", "offline.html", "icons/apple-touch-icon.png"]) {
  try {
    if ((await stat(path.join(root, "public", file))).size === 0) {
      errors.push(`${file} is empty`);
    }
  } catch {
    errors.push(`${file} is missing`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  "Validated installable PWA assets and relative GitHub Pages scope.",
);
