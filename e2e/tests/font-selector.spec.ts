import { test, expect } from "@playwright/test";

test.describe("Font Selector", () => {
  test("font selector dropdown exists in header", async ({ page }) => {
    await page.goto("/");
    const fontSelector = page.locator("#font-selector");
    await expect(fontSelector).toBeVisible();
  });

  test("dropdown has 3 options: Fira Code, Ubuntu Mono, Victor Mono", async ({
    page,
  }) => {
    await page.goto("/");
    const options = page.locator("#font-selector option");
    await expect(options).toHaveCount(3);

    const values = await options.allTextContents();
    expect(values).toEqual(["Fira Code", "Ubuntu Mono", "Victor Mono"]);
  });

  test("default selected value is Fira Code", async ({ page }) => {
    await page.goto("/");
    const fontSelector = page.locator("#font-selector");
    await expect(fontSelector).toHaveValue("Fira Code");
  });

  test("changing to Ubuntu Mono updates --catscope-mono-font CSS variable", async ({
    page,
  }) => {
    await page.goto("/");
    const fontSelector = page.locator("#font-selector");

    await fontSelector.selectOption("Ubuntu Mono");

    // Check that the CSS variable on :root contains "Ubuntu Mono"
    const fontValue = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--catscope-mono-font")
        .trim();
    });

    expect(fontValue).toContain("Ubuntu Mono");
  });

  test("font change applies to already-open preview windows", async ({
    page,
  }) => {
    await page.goto("/");

    // Open a text file by clicking its name in the file tree
    await page.locator(".dir-entry .name", { hasText: "hello.txt" }).click();

    // Wait for the preview window and its iframe to load
    const previewWindow = page.locator(".preview-window").first();
    await expect(previewWindow).toBeVisible();
    const iframe = previewWindow.locator("iframe");
    await iframe.waitFor({ state: "attached" });

    // Wait for the iframe to fully load its content
    const iframeElement = await iframe.elementHandle();
    await iframeElement!.waitForSelector("#catscope-font-style", {
      state: "attached",
    });

    // Verify initial font is Fira Code
    const initialFont = await iframe.evaluate((el: HTMLIFrameElement) => {
      const style = el.contentDocument?.getElementById("catscope-font-style");
      return style?.textContent || "";
    });
    expect(initialFont).toContain("Fira Code");

    // Change the font to Ubuntu Mono
    const fontSelector = page.locator("#font-selector");
    await fontSelector.selectOption("Ubuntu Mono");

    // Verify the iframe's injected style now reflects Ubuntu Mono
    const updatedFont = await iframe.evaluate((el: HTMLIFrameElement) => {
      const style = el.contentDocument?.getElementById("catscope-font-style");
      return style?.textContent || "";
    });
    expect(updatedFont).toContain("Ubuntu Mono");
    expect(updatedFont).not.toContain("Fira Code");

    // Change again to Victor Mono to confirm repeated changes work
    await fontSelector.selectOption("Victor Mono");

    const finalFont = await iframe.evaluate((el: HTMLIFrameElement) => {
      const style = el.contentDocument?.getElementById("catscope-font-style");
      return style?.textContent || "";
    });
    expect(finalFont).toContain("Victor Mono");
    expect(finalFont).not.toContain("Ubuntu Mono");
  });
});
