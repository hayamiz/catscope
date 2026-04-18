import { test, expect } from "@playwright/test";

test.describe("Sidebar Resize", () => {
  test("resize handle element exists", async ({ page }) => {
    await page.goto("/");
    const handle = page.locator("#sidebar-resize-handle");
    await expect(handle).toBeVisible();
  });

  test("sidebar starts at 300px width", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#sidebar");
    const box = await sidebar.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBe(300);
  });

  test("dragging handle increases sidebar width", async ({ page }) => {
    await page.goto("/");
    const handle = page.locator("#sidebar-resize-handle");
    const sidebar = page.locator("#sidebar");

    const initialBox = await sidebar.boundingBox();
    expect(initialBox).toBeTruthy();
    expect(initialBox!.width).toBe(300);

    const handleBox = await handle.boundingBox();
    expect(handleBox).toBeTruthy();

    // Simulate pointer drag: pointerdown, pointermove 100px to the right, pointerup
    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    const handleCenterY = handleBox!.y + handleBox!.height / 2;

    await page.mouse.move(handleCenterX, handleCenterY);
    await page.mouse.down();
    await page.mouse.move(handleCenterX + 100, handleCenterY, { steps: 10 });
    await page.mouse.up();

    const newBox = await sidebar.boundingBox();
    expect(newBox).toBeTruthy();
    // Sidebar should have grown by approximately 100px (allow some tolerance)
    expect(newBox!.width).toBeGreaterThanOrEqual(390);
    expect(newBox!.width).toBeLessThanOrEqual(410);
  });
});
