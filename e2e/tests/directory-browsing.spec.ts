import { test, expect } from "@playwright/test";

test.describe("Directory Browsing", () => {
  test("should display file tree on page load", async ({ page }) => {
    await page.goto("/");
    // Wait for file tree to load
    const entries = page.locator("#file-tree .dir-entry");
    await expect(entries.first()).toBeVisible({ timeout: 5000 });
    // Should have multiple entries
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should include hidden files (dotfiles)", async ({ page }) => {
    await page.goto("/");
    await page.locator("#file-tree .dir-entry").first().waitFor();
    const names = page.locator("#file-tree .dir-entry .name");
    const allNames: string[] = [];
    for (let i = 0; i < (await names.count()); i++) {
      allNames.push((await names.nth(i).textContent()) || "");
    }
    expect(allNames).toContain(".hidden");
  });

  test("should expand and collapse directories", async ({ page }) => {
    await page.goto("/");
    // Find and click the subdir entry
    const subdirEntry = page
      .locator("#file-tree .dir-entry .name", { hasText: "subdir" })
      .first();
    await subdirEntry.waitFor();
    await subdirEntry.click();

    // Should show nested content
    const nestedEntry = page.locator(".dir-children .dir-entry .name", {
      hasText: "nested.txt",
    });
    await expect(nestedEntry).toBeVisible({ timeout: 5000 });

    // Click again to collapse
    await subdirEntry.click();
    await expect(nestedEntry).not.toBeVisible();
  });

  test("should refresh directory contents", async ({ page }) => {
    await page.goto("/");
    // Expand subdir first
    const subdirEntry = page
      .locator("#file-tree .dir-entry .name", { hasText: "subdir" })
      .first();
    await subdirEntry.waitFor();
    await subdirEntry.click();

    const nestedEntry = page.locator(".dir-children .dir-entry .name", {
      hasText: "nested.txt",
    });
    await expect(nestedEntry).toBeVisible({ timeout: 5000 });

    // Click refresh button on the subdir
    const refreshBtn = page
      .locator("#file-tree li[data-opened='true'] .dir-entry .action-btn")
      .first();
    await refreshBtn.click();

    // Nested content should still be visible after refresh
    await expect(nestedEntry).toBeVisible({ timeout: 5000 });
  });
});
