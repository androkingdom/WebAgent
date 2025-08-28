// playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // essential for serverless
    ignoreHTTPSErrors: true,
  },
});
