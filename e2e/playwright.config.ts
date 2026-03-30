import { defineConfig } from "@playwright/test";

const port = process.env.CATSCOPE_TEST_PORT || "4567";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
  },
  webServer: {
    command: `cd .. && go build -o catscope . && cd e2e/testdata && ../../catscope --port ${port} --no-password`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 15000,
  },
});
