import { test, expect } from "@playwright/test";

test.describe("Download", () => {
  test("should trigger download via download button", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page
      .locator("#file-tree .dir-entry", { hasText: "hello.txt" })
      .first();
    await fileEntry.waitFor();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent("download");
    const dlBtn = fileEntry.locator('.action-btn[title="Download"]');
    await dlBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("hello.txt");
  });

  test("should return correct content-disposition header", async ({
    request,
  }) => {
    const response = await request.get("/save/hello.txt");
    expect(response.status()).toBe(200);
    const cd = response.headers()["content-disposition"];
    expect(cd).toContain("attachment");
    expect(cd).toContain("hello.txt");
  });

  test("should return correct content-type for save endpoint", async ({
    request,
  }) => {
    const response = await request.get("/save/hello.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(
      "application/octet-stream"
    );
  });
});
