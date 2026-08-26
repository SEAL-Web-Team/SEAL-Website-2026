import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Playwright specs live in e2e/ and are driven by `npm run test:e2e`; vitest
    // would try to execute them as unit tests otherwise.
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/lib/intake/__tests__/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
