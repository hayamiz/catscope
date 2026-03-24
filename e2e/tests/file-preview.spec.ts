import { test, expect } from "@playwright/test";

test.describe("File Preview", () => {
  test("should open text file preview window", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    // Preview window should appear
    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Title should show file path
    const title = previewWindow.locator(".preview-title");
    await expect(title).toContainText("hello.txt");

    // Content should be an iframe for text files
    const iframe = previewWindow.locator(".preview-content iframe");
    await expect(iframe).toBeVisible();
  });

  test("should open image file preview window", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "test.png",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Content should be an img for images
    const img = previewWindow.locator(".preview-content img");
    await expect(img).toBeVisible();
  });

  test("should open SVG file preview window", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "test.svg",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const img = previewWindow.locator(".preview-content img");
    await expect(img).toBeVisible();
  });

  test("should show copy button for text files only", async ({ page }) => {
    await page.goto("/");

    // Open text file - should have copy button
    const txtEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await txtEntry.waitFor();
    await txtEntry.click();

    const previewWindow = page.locator(".preview-window").first();
    await expect(previewWindow).toBeVisible({ timeout: 5000 });
    const copyBtn = previewWindow.locator(
      '.preview-titlebar .btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).toBeVisible();
  });

  test("should not show copy button for image files", async ({ page }) => {
    await page.goto("/");
    const imgEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "test.png",
    });
    await imgEntry.waitFor();
    await imgEntry.click();

    const previewWindow = page.locator(".preview-window").first();
    await expect(previewWindow).toBeVisible({ timeout: 5000 });
    const copyBtn = previewWindow.locator(
      '.preview-titlebar .btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).not.toBeVisible();
  });
});
