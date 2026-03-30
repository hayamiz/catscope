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

  test("should preserve expanded subdirectory state on dir_changed refresh", async ({
    page,
  }) => {
    const testDir = path.join(__dirname, "..", "testdata", "subdir");
    const nestedDir = path.join(testDir, "nested-dir");
    const nestedFile = path.join(nestedDir, "deep.txt");
    const triggerFile = path.join(testDir, "trigger-file.txt");

    // Set up nested directory structure
    if (!fs.existsSync(nestedDir)) fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(nestedFile, "deep content\n");
    if (fs.existsSync(triggerFile)) fs.unlinkSync(triggerFile);

    try {
      await page.goto("/");

      // Expand subdir
      const subdirEntry = page
        .locator("#file-tree > li > .dir-entry .name", { hasText: "subdir" })
        .first();
      await subdirEntry.waitFor();
      await subdirEntry.click();

      // Wait for subdir contents to load
      const nestedDirEntry = page.locator(".dir-children .dir-entry .name", {
        hasText: "nested-dir",
      });
      await expect(nestedDirEntry).toBeVisible({ timeout: 5000 });

      // Expand nested-dir
      await nestedDirEntry.click();

      // Verify deep.txt is visible inside nested-dir
      const deepFile = page.locator(".dir-children .dir-children .dir-entry .name", {
        hasText: "deep.txt",
      });
      await expect(deepFile).toBeVisible({ timeout: 5000 });

      // Create a new file in subdir to trigger dir_changed
      fs.writeFileSync(triggerFile, "trigger\n");

      // Wait for the new file to appear (confirms dir_changed was processed)
      const triggerEntry = page.locator(".dir-children .dir-entry .name", {
        hasText: "trigger-file.txt",
      });
      await expect(triggerEntry).toBeVisible({ timeout: 5000 });

      // Verify nested-dir is still expanded and deep.txt is still visible
      await expect(deepFile).toBeVisible({ timeout: 5000 });
    } finally {
      if (fs.existsSync(triggerFile)) fs.unlinkSync(triggerFile);
      if (fs.existsSync(nestedFile)) fs.unlinkSync(nestedFile);
      if (fs.existsSync(nestedDir)) fs.rmdirSync(nestedDir);
    }
  });

  test("should handle deleted expanded directory gracefully", async ({
    page,
  }) => {
    const testDir = path.join(__dirname, "..", "testdata", "subdir");
    const tempDir = path.join(testDir, "temp-dir");
    const tempFile = path.join(tempDir, "inside.txt");

    // Set up temp directory
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(tempFile, "inside content\n");

    try {
      await page.goto("/");

      // Listen for JS errors
      const jsErrors: string[] = [];
      page.on("pageerror", (err) => jsErrors.push(err.message));

      // Expand subdir
      const subdirEntry = page
        .locator("#file-tree > li > .dir-entry .name", { hasText: "subdir" })
        .first();
      await subdirEntry.waitFor();
      await subdirEntry.click();

      // Wait for temp-dir to appear
      const tempDirEntry = page.locator(".dir-children .dir-entry .name", {
        hasText: "temp-dir",
      });
      await expect(tempDirEntry).toBeVisible({ timeout: 5000 });

      // Expand temp-dir
      await tempDirEntry.click();

      // Verify inside.txt is visible
      const insideFile = page.locator(".dir-children .dir-children .dir-entry .name", {
        hasText: "inside.txt",
      });
      await expect(insideFile).toBeVisible({ timeout: 5000 });

      // Delete the expanded directory
      fs.unlinkSync(tempFile);
      fs.rmdirSync(tempDir);

      // The directory should disappear from the tree
      await expect(tempDirEntry).not.toBeVisible({ timeout: 5000 });

      // subdir should still be expanded (nested.txt should be visible)
      const nestedTxt = page.locator(".dir-children .dir-entry .name", {
        hasText: "nested.txt",
      });
      await expect(nestedTxt).toBeVisible({ timeout: 5000 });

      // No JS errors should have occurred
      expect(jsErrors).toEqual([]);
    } finally {
      // Clean up in case test failed before deletion
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    }
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
