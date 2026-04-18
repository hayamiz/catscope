import { test, expect } from "@playwright/test";

test.describe("Render Toggle", () => {
  // NOTE: The testdata directory does not include a .md file by default.
  // "hello.txt" is used as a renderable text file (.txt is in RENDERABLE_EXTENSIONS).
  // If .md-specific behavior needs testing, add a .md fixture to e2e/testdata/.

  test("toggle button is visible for a renderable text file", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const toggleBtn = previewWindow.locator(".render-toggle");
    await expect(toggleBtn).toBeVisible();
  });

  test("toggle button contains an img element, not text", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const toggleBtn = previewWindow.locator(".render-toggle");
    await expect(toggleBtn).toBeVisible();

    // Should contain an img element
    const img = toggleBtn.locator("img");
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", "/assets/icons/code.svg");

    // Should NOT have direct text content (the button label is an icon, not text)
    const textContent = await toggleBtn.evaluate(
      (el) => el.childNodes[0]?.nodeType === Node.TEXT_NODE
    );
    expect(textContent).toBeFalsy();
  });

  test("toggle button is NOT visible for an image file", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "test.png",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const toggleBtn = previewWindow.locator(".render-toggle");
    await expect(toggleBtn).not.toBeVisible();
  });

  test("clicking toggle adds .active class to the button", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const toggleBtn = previewWindow.locator(".render-toggle");
    await expect(toggleBtn).not.toHaveClass(/active/);

    await toggleBtn.click();
    await expect(toggleBtn).toHaveClass(/active/);
  });

  test("clicking toggle switches iframe src from /preview/ to /render/", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const iframe = previewWindow.locator(".preview-content iframe");
    await expect(iframe).toBeVisible();

    // Initially the iframe src should contain /preview/
    const initialSrc = await iframe.getAttribute("src");
    expect(initialSrc).toContain("/preview/");

    // Click toggle to switch to render mode
    const toggleBtn = previewWindow.locator(".render-toggle");
    await toggleBtn.click();

    // After toggle, iframe src should contain /render/
    const renderIframe = previewWindow.locator(".preview-content iframe");
    await expect(renderIframe).toBeVisible();
    const renderSrc = await renderIframe.getAttribute("src");
    expect(renderSrc).toContain("/render/");
  });

  test("clicking toggle again switches iframe src back to /preview/", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const toggleBtn = previewWindow.locator(".render-toggle");

    // Click once to enter render mode
    await toggleBtn.click();
    const renderIframe = previewWindow.locator(".preview-content iframe");
    const renderSrc = await renderIframe.getAttribute("src");
    expect(renderSrc).toContain("/render/");

    // Click again to return to preview mode
    await toggleBtn.click();
    const previewIframe = previewWindow.locator(".preview-content iframe");
    await expect(previewIframe).toBeVisible();
    const previewSrc = await previewIframe.getAttribute("src");
    expect(previewSrc).toContain("/preview/");

    // Button should no longer have .active class
    await expect(toggleBtn).not.toHaveClass(/active/);
  });
});
