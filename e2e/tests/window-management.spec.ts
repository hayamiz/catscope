import { test, expect } from "@playwright/test";

test.describe("Window Management", () => {
  test("should open window with correct default size", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const box = await previewWindow.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBe(600);
    expect(box!.height).toBe(400);
  });

  test("should close window on close button click", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const closeBtn = previewWindow.locator('.btn[title="Close"]');
    await closeBtn.click();

    await expect(previewWindow).not.toBeVisible();
  });

  test("should bring window to front on click", async ({ page }) => {
    await page.goto("/");

    // Open first window
    const entry1 = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await entry1.waitFor();
    await entry1.click();

    const win1 = page.locator(".preview-window").first();
    await expect(win1).toBeVisible({ timeout: 5000 });

    // Open second window
    const entry2 = page.locator("#file-tree .dir-entry .name", {
      hasText: "data.json",
    });
    await entry2.click();

    await page.waitForTimeout(300);
    const windows = page.locator(".preview-window");
    expect(await windows.count()).toBe(2);

    // Click the first window's title bar to bring it to front
    const firstWindow = windows.first();
    await firstWindow.locator(".preview-titlebar").click();

    await page.waitForTimeout(100);

    // First window should have higher z-index than second
    const z1 = await firstWindow.evaluate(
      (el) => window.getComputedStyle(el).zIndex
    );
    const secondWindow = windows.nth(1);
    const z2 = await secondWindow.evaluate(
      (el) => window.getComputedStyle(el).zIndex
    );

    expect(parseInt(z1)).toBeGreaterThan(parseInt(z2));
  });

  test("should drag window to move it", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const titleBar = previewWindow.locator(".preview-titlebar");
    const initialBox = await previewWindow.boundingBox();

    // Drag the title bar
    await titleBar.hover();
    await page.mouse.down();
    await page.mouse.move(
      initialBox!.x + initialBox!.width / 2 + 100,
      initialBox!.y + 15 + 50
    );
    await page.mouse.up();

    const newBox = await previewWindow.boundingBox();
    expect(newBox!.x).toBeGreaterThan(initialBox!.x);
    expect(newBox!.y).toBeGreaterThan(initialBox!.y);
  });

  test("should resize window via bottom-right corner", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const initialBox = await previewWindow.boundingBox();
    const resizeHandle = previewWindow.locator(".preview-resize");

    // Drag the resize handle
    const handleBox = await resizeHandle.boundingBox();
    await page.mouse.move(
      handleBox!.x + handleBox!.width / 2,
      handleBox!.y + handleBox!.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      handleBox!.x + handleBox!.width / 2 + 100,
      handleBox!.y + handleBox!.height / 2 + 50
    );
    await page.mouse.up();

    const newBox = await previewWindow.boundingBox();
    expect(newBox!.width).toBeGreaterThan(initialBox!.width);
    expect(newBox!.height).toBeGreaterThan(initialBox!.height);
  });

  test("should cascade placement for multiple windows", async ({ page }) => {
    await page.goto("/");

    // Open two windows
    const entry1 = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await entry1.waitFor();
    await entry1.click();

    await page.waitForTimeout(200);

    const entry2 = page.locator("#file-tree .dir-entry .name", {
      hasText: "data.json",
    });
    await entry2.click();

    await page.waitForTimeout(200);

    const windows = page.locator(".preview-window");
    expect(await windows.count()).toBe(2);

    const box1 = await windows.first().boundingBox();
    const box2 = await windows.nth(1).boundingBox();

    // Second window should be offset from first
    expect(box2!.x).toBeGreaterThan(box1!.x);
    expect(box2!.y).toBeGreaterThan(box1!.y);
  });
});
