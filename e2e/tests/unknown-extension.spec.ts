import { test, expect } from "@playwright/test";

test.describe("Unknown Extension Files", () => {
  test("should preview text file with unknown extension (.conf) as text", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "config.conf",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Should display in an iframe (text content)
    const iframe = previewWindow.locator(".preview-content iframe");
    await expect(iframe).toBeVisible();

    // Verify the server returned text/plain by checking iframe loads successfully
    const src = await iframe.getAttribute("src");
    expect(src).toContain("/preview/config.conf");

    const response = await page.request.get("/preview/config.conf");
    expect(response.headers()["content-type"]).toBe(
      "text/plain; charset=utf-8"
    );
  });

  test("should preview extensionless text file (Makefile) as text", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "Makefile",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const iframe = previewWindow.locator(".preview-content iframe");
    await expect(iframe).toBeVisible();

    const response = await page.request.get("/preview/Makefile");
    expect(response.headers()["content-type"]).toBe(
      "text/plain; charset=utf-8"
    );
  });

  test("should serve binary file with unknown extension as octet-stream", async ({
    page,
  }) => {
    const response = await page.request.get("/preview/binaryfile.dat");
    expect(response.headers()["content-type"]).toBe(
      "application/octet-stream"
    );
  });

  test("should show copy button for text file with unknown extension", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "config.conf",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Copy button should appear (async, so wait for it)
    const copyBtn = previewWindow.locator(
      '.preview-titlebar .btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).toBeVisible({ timeout: 5000 });
  });

  test("should not show copy button for binary file with unknown extension", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "binaryfile.dat",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Wait a moment for async HEAD request to complete, then verify no copy button
    await page.waitForTimeout(1000);
    const copyBtn = previewWindow.locator(
      '.preview-titlebar .btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).not.toBeVisible();
  });

  test("should copy text content of unknown extension file to clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "config.conf",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const copyBtn = previewWindow.locator(
      '.btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).toBeVisible({ timeout: 5000 });

    // Wait for text content to be fetched
    await page.waitForTimeout(500);
    await copyBtn.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText("Copied to clipboard");
  });
});
