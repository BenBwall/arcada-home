import { defineConfig } from "@playwright/test";

const PREVIEW_PORT = 4173;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.pw.ts",
  use: {
    baseURL: "http://127.0.0.1:4173/~bergenwb/",
    browserName: "chromium",
    channel: "msedge",
  },
  webServer: {
    command: "bun run preview",
    port: PREVIEW_PORT,
    reuseExistingServer: !process.env.CI,
  },
});
