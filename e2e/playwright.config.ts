import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4567",
    headless: true,
  },
  webServer: {
    command: "cd .. && go build -o catscope . && cd e2e/testdata && ../../catscope",
    url: "http://127.0.0.1:4567",
    reuseExistingServer: false,
    timeout: 15000,
  },
});
