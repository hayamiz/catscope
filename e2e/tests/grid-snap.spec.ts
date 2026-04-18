import { test, expect } from "@playwright/test";

test.describe("Grid Snap", () => {
  test("grid snap toggle button exists in header", async ({ page }) => {
    await page.goto("/");
    const gridSnapBtn = page.locator("#grid-snap-btn");
    await expect(gridSnapBtn).toBeVisible();
  });

  test("grid snap button has .active class by default", async ({ page }) => {
    await page.goto("/");
    const gridSnapBtn = page.locator("#grid-snap-btn");
    await expect(gridSnapBtn).toHaveClass(/active/);
  });

  test("#main has .grid-active class by default", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("#main");
    await expect(main).toHaveClass(/grid-active/);
  });

  test("clicking grid snap button removes .active and .grid-active", async ({
    page,
  }) => {
    await page.goto("/");
    const gridSnapBtn = page.locator("#grid-snap-btn");
    const main = page.locator("#main");

    // Verify initial state
    await expect(gridSnapBtn).toHaveClass(/active/);
    await expect(main).toHaveClass(/grid-active/);

    // Click to disable grid snap
    await gridSnapBtn.click();

    await expect(gridSnapBtn).not.toHaveClass(/active/);
    await expect(main).not.toHaveClass(/grid-active/);
  });

  test("clicking grid snap button again restores both classes", async ({
    page,
  }) => {
    await page.goto("/");
    const gridSnapBtn = page.locator("#grid-snap-btn");
    const main = page.locator("#main");

    // Click once to disable
    await gridSnapBtn.click();
    await expect(gridSnapBtn).not.toHaveClass(/active/);
    await expect(main).not.toHaveClass(/grid-active/);

    // Click again to re-enable
    await gridSnapBtn.click();
    await expect(gridSnapBtn).toHaveClass(/active/);
    await expect(main).toHaveClass(/grid-active/);
  });
});
