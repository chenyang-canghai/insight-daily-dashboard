import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/frontend/setup.ts"],
    include: ["tests/frontend/**/*.test.{ts,tsx}"],
    coverage: { reporter: ["text", "json-summary"] },
  },
});
