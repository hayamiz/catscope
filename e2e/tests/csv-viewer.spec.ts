import { test, expect } from "@playwright/test";

test.describe("CSV/TSV Table Viewer", () => {
  test("should render CSV file as a table", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "sample.csv",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // Should have a table, not an iframe
    const table = previewWindow.locator(".preview-content table.csv-table");
    await expect(table).toBeVisible({ timeout: 5000 });
    const iframe = previewWindow.locator(".preview-content iframe");
    await expect(iframe).not.toBeVisible();
  });

  test("should render TSV file as a table", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "sample.tsv",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const table = previewWindow.locator(".preview-content table.csv-table");
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test("should have header row in thead with th elements", async ({
    page,
  }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "sample.csv",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const table = previewWindow.locator("table.csv-table");
    await expect(table).toBeVisible({ timeout: 5000 });

    // Verify thead exists with th elements
    const thead = table.locator("thead");
    await expect(thead).toBeVisible();
    const headers = thead.locator("th");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toContainText("Name");
    await expect(headers.nth(1)).toContainText("Age");
    await expect(headers.nth(2)).toContainText("City");
    await expect(headers.nth(3)).toContainText("Score");
  });

  test("should have striped rows in tbody", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "sample.csv",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const table = previewWindow.locator("table.csv-table");
    await expect(table).toBeVisible({ timeout: 5000 });

    const bodyRows = table.locator("tbody tr");
    await expect(bodyRows).toHaveCount(5);

    // Even rows (0-indexed: 1st, 3rd = 2nd and 4th in CSS 1-indexed)
    // should have different background than odd rows
    const evenRow = bodyRows.nth(1); // 2nd row (CSS nth-child(2) = even)
    const oddRow = bodyRows.nth(0); // 1st row (CSS nth-child(1) = odd)
    const evenBg = await evenRow.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const oddBg = await oddRow.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(evenBg).not.toBe(oddBg);
  });

  test("should sort by column on header click", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "sample.csv",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    const table = previewWindow.locator("table.csv-table");
    await expect(table).toBeVisible({ timeout: 5000 });

    // Click "Age" header to sort ascending
    const ageHeader = table.locator("thead th").nth(1);
    await ageHeader.click();

    // First data row should be Bob (age 25, lowest)
    const firstCell = table.locator("tbody tr").first().locator("td").first();
    await expect(firstCell).toHaveText("Bob");

    // Sort arrow should show ascending
    const arrow = ageHeader.locator(".sort-arrow");
    await expect(arrow).toContainText("▲");

    // Click again to sort descending
    await ageHeader.click();

    // First data row should be Charlie (age 35, highest)
    const firstCellDesc = table
      .locator("tbody tr")
      .first()
      .locator("td")
      .first();
    await expect(firstCellDesc).toHaveText("Charlie");

    // Sort arrow should show descending
    await expect(arrow).toContainText("▼");
  });

  test("should show copy button for CSV files", async ({ page }) => {
    await page.goto("/");
    const fileEntry = page.locator("#file-tree .dir-entry .name", {
      hasText: "sample.csv",
    });
    await fileEntry.waitFor();
    await fileEntry.click();

    const previewWindow = page.locator(".preview-window");
    await expect(previewWindow).toBeVisible({ timeout: 5000 });

    // CSV is a text file, so copy button should be available
    const copyBtn = previewWindow.locator(
      '.preview-titlebar .btn[title="Copy to clipboard"]'
    );
    await expect(copyBtn).toBeVisible({ timeout: 5000 });
  });
});
