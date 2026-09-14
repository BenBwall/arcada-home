import { defineConfig } from "@playwright/test";

const PREVIEW_PORT = 4174;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.pw.ts",
  use: {
    baseURL: `http://127.0.0.1:${PREVIEW_PORT}/~bergenwb/`,
    browserName: "chromium",
    channel: "msedge",
  },
  webServer: {
    command: "bun run preview",
    env: { PORT: String(PREVIEW_PORT) },
    port: PREVIEW_PORT,
    reuseExistingServer: false,
  },
});
