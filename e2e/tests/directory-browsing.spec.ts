import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

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

  test("should auto-refresh when a file is created in a directory", async ({
    page,
  }) => {
    const testDir = path.join(__dirname, "..", "testdata", "subdir");
    const newFile = path.join(testDir, "new-file.txt");

    // Clean up in case a previous test run left the file
    if (fs.existsSync(newFile)) fs.unlinkSync(newFile);

    await page.goto("/");
    // Expand subdir
    const subdirEntry = page
      .locator("#file-tree .dir-entry .name", { hasText: "subdir" })
      .first();
    await subdirEntry.waitFor();
    await subdirEntry.click();

    const nestedEntry = page.locator(".dir-children .dir-entry .name", {
      hasText: "nested.txt",
    });
    await expect(nestedEntry).toBeVisible({ timeout: 5000 });

    // Verify new file does not exist in the tree yet
    const newFileEntry = page.locator(".dir-children .dir-entry .name", {
      hasText: "new-file.txt",
    });
    await expect(newFileEntry).not.toBeVisible();

    // Create a new file in the directory
    fs.writeFileSync(newFile, "hello\n");

    try {
      // The directory tree should auto-refresh and show the new file
      await expect(newFileEntry).toBeVisible({ timeout: 5000 });
    } finally {
      // Clean up
      if (fs.existsSync(newFile)) fs.unlinkSync(newFile);
    }
  });

  test("should auto-refresh when a file is deleted from a directory", async ({
    page,
  }) => {
    const testDir = path.join(__dirname, "..", "testdata", "subdir");
    const tempFile = path.join(testDir, "temp-file.txt");

    // Create a temporary file before navigating
    fs.writeFileSync(tempFile, "temporary\n");

    await page.goto("/");
    // Expand subdir
    const subdirEntry = page
      .locator("#file-tree .dir-entry .name", { hasText: "subdir" })
      .first();
    await subdirEntry.waitFor();
    await subdirEntry.click();

    // Verify the temp file is visible
    const tempFileEntry = page.locator(".dir-children .dir-entry .name", {
      hasText: "temp-file.txt",
    });
    await expect(tempFileEntry).toBeVisible({ timeout: 5000 });

    // Delete the file
    fs.unlinkSync(tempFile);

    // The directory tree should auto-refresh and the file should disappear
    await expect(tempFileEntry).not.toBeVisible({ timeout: 5000 });
  });

  test("should auto-refresh root directory when a file is created", async ({
    page,
  }) => {
    const testDir = path.join(__dirname, "..", "testdata");
    const newFile = path.join(testDir, "root-new-file.txt");

    if (fs.existsSync(newFile)) fs.unlinkSync(newFile);

    await page.goto("/");
    await page.locator("#file-tree .dir-entry").first().waitFor();

    // Verify the file does not exist
    const newFileEntry = page.locator(
      "#file-tree > li > .dir-entry .name",
      { hasText: "root-new-file.txt" }
    );
    await expect(newFileEntry).not.toBeVisible();

    // Create a new file in the root
    fs.writeFileSync(newFile, "root test\n");

    try {
      // Should auto-refresh and show the new file
      await expect(newFileEntry).toBeVisible({ timeout: 5000 });
    } finally {
      if (fs.existsSync(newFile)) fs.unlinkSync(newFile);
    }
  });
});
