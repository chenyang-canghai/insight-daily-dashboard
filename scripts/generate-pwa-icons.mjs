import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public", "icons");

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function roundedRect(x, y, left, top, right, bottom, radius) {
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const halfWidth = (right - left) / 2;
  const halfHeight = (bottom - top) / 2;
  const qx = Math.abs(x - centerX) - (halfWidth - radius);
  const qy = Math.abs(y - centerY) - (halfHeight - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
      Math.min(Math.max(qx, qy), 0) -
      radius <=
    0
  );
}

function line(x, y, startX, startY, endX, endY, width) {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const projection = Math.max(
    0,
    Math.min(1, ((x - startX) * dx + (y - startY) * dy) / lengthSquared),
  );
  return (
    Math.hypot(
      x - (startX + projection * dx),
      y - (startY + projection * dy),
    ) <=
    width / 2
  );
}

function mark(x, y) {
  const width = 0.052;
  return (
    line(x, y, 0.24, 0.29, 0.43, 0.29, width) ||
    line(x, y, 0.21, 0.42, 0.49, 0.42, width) ||
    line(x, y, 0.36, 0.23, 0.35, 0.55, width) ||
    line(x, y, 0.35, 0.52, 0.21, 0.72, width) ||
    line(x, y, 0.36, 0.52, 0.52, 0.72, width) ||
    line(x, y, 0.57, 0.36, 0.79, 0.36, width) ||
    line(x, y, 0.57, 0.36, 0.57, 0.68, width) ||
    line(x, y, 0.79, 0.36, 0.79, 0.68, width) ||
    line(x, y, 0.57, 0.68, 0.79, 0.68, width)
  );
}

function render(size) {
  const supersample = 2;
  const large = size * supersample;
  const pixels = Buffer.alloc(size * size * 4);
  const background = [15, 63, 49, 255];
  const surface = [31, 111, 89, 255];
  const foreground = [247, 244, 235, 255];
  const accent = [216, 177, 92, 255];

  for (let targetY = 0; targetY < size; targetY += 1) {
    for (let targetX = 0; targetX < size; targetX += 1) {
      const sum = [0, 0, 0, 0];
      for (let sampleY = 0; sampleY < supersample; sampleY += 1) {
        for (let sampleX = 0; sampleX < supersample; sampleX += 1) {
          const x = (targetX * supersample + sampleX + 0.5) / large;
          const y = (targetY * supersample + sampleY + 0.5) / large;
          let color = background;
          if (roundedRect(x, y, 0.07, 0.07, 0.93, 0.93, 0.19)) {
            color = surface;
          }
          if (mark(x, y)) {
            color = foreground;
          }
          if (Math.hypot(x - 0.23, y - 0.22) <= 0.035) {
            color = accent;
          }
          for (let channel = 0; channel < 4; channel += 1) {
            sum[channel] += color[channel];
          }
        }
      }
      const offset = (targetY * size + targetX) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        pixels[offset + channel] = Math.round(sum[channel] / 4);
      }
    }
  }
  return pixels;
}

function png(size) {
  const pixels = render(size);
  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row += 1) {
    const target = row * (size * 4 + 1);
    scanlines[target] = 0;
    pixels.copy(scanlines, target + 1, row * size * 4, (row + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND"),
  ]);
}

await mkdir(output, { recursive: true });
for (const [name, size] of [
  ["pwa-192.png", 192],
  ["pwa-512.png", 512],
  ["pwa-maskable-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["badge-96.png", 96],
]) {
  await writeFile(path.join(output, name), png(size));
}

console.log("Generated PWA icons in public/icons");
