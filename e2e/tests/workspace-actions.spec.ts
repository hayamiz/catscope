import { test, expect } from "@playwright/test";

test.describe("Workspace Actions", () => {
  test("close-all button exists in header", async ({ page }) => {
    await page.goto("/");
    const closeAllBtn = page.locator("#close-all-btn");
    await expect(closeAllBtn).toBeVisible();
  });

  test("tile button exists in header", async ({ page }) => {
    await page.goto("/");
    const tileBtn = page.locator("#tile-btn");
    await expect(tileBtn).toBeVisible();
  });

  test("close all removes all preview windows", async ({ page }) => {
    await page.goto("/");

    // Open 3 files
    const entry1 = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await entry1.waitFor();
    await entry1.click();
    await expect(page.locator(".preview-window").first()).toBeVisible({
      timeout: 5000,
    });

    const entry2 = page.locator("#file-tree .dir-entry .name", {
      hasText: "data.json",
    });
    await entry2.click();
    await page.waitForTimeout(300);

    const entry3 = page.locator("#file-tree .dir-entry .name", {
      hasText: "test.svg",
    });
    await entry3.click();
    await page.waitForTimeout(300);

    expect(await page.locator(".preview-window").count()).toBe(3);

    // Click close all
    await page.locator("#close-all-btn").click();

    // All windows should be gone
    await expect(page.locator(".preview-window")).toHaveCount(0);
  });

  test("tile arranges windows in a grid with no overlap", async ({ page }) => {
    await page.goto("/");

    // Open 3 files
    const entry1 = page.locator("#file-tree .dir-entry .name", {
      hasText: "hello.txt",
    });
    await entry1.waitFor();
    await entry1.click();
    await expect(page.locator(".preview-window").first()).toBeVisible({
      timeout: 5000,
    });

    const entry2 = page.locator("#file-tree .dir-entry .name", {
      hasText: "data.json",
    });
    await entry2.click();
    await page.waitForTimeout(300);

    const entry3 = page.locator("#file-tree .dir-entry .name", {
      hasText: "test.svg",
    });
    await entry3.click();
    await page.waitForTimeout(300);

    expect(await page.locator(".preview-window").count()).toBe(3);

    // Click tile
    await page.locator("#tile-btn").click();
    await page.waitForTimeout(200);

    // Collect positions of all 3 windows
    const windows = page.locator(".preview-window");
    const positions: { left: number; top: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const box = await windows.nth(i).boundingBox();
      expect(box).toBeTruthy();
      positions.push({ left: box!.x, top: box!.y });
    }

    // All windows should have distinct top/left combinations (no full overlap)
    const posStrings = positions.map((p) => `${p.left},${p.top}`);
    const uniquePositions = new Set(posStrings);
    expect(uniquePositions.size).toBe(3);
  });

  test("close all with no windows open does not cause errors", async ({
    page,
  }) => {
    await page.goto("/");

    // Ensure no windows are open
    expect(await page.locator(".preview-window").count()).toBe(0);

    // Click close all — should not throw
    await page.locator("#close-all-btn").click();

    // Page should still be functional: file tree is visible
    await expect(page.locator("#file-tree")).toBeVisible();
  });
});
