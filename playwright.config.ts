import { defineConfig } from "@playwright/test";

// The smoke test runs against the Docker container: `docker compose up --build -d` first.
// Point it elsewhere with PLAYWRIGHT_BASE_URL (for example a `next dev` server).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    // Mobile first: 390 px is the design width (design.md §4).
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
});
