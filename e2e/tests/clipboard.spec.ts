import { test, expect } from "@playwright/test";

test.describe("Clipboard Copy", () => {
  test("should have copy button for text files", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const copyBtn = previewWindow.locator(
      '.btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).toBeVisible();
  });

  test("should show toast notification on copy", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Wait for text content to be fetched
    await page.waitForTimeout(500);

    const copyBtn = previewWindow.locator(
      '.btn[title="Copy to clipboard"]'
    );
    await copyBtn.click();

    // Toast should appear
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText("Copied to clipboard");

    // Toast should fade away
    await expect(toast).not.toBeVisible({ timeout: 5000 });
  });

  test("should have copy button for JSON files", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "data.json",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const copyBtn = previewWindow.locator(
      '.btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).toBeVisible();
  });
});
