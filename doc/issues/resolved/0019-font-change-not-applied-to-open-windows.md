---
id: "0019"
title: "Font change not applied to already-open windows"
type: bug
priority: medium
status: resolved
created: 2026-04-18
updated: 2026-04-18
---

## Description

When changing the font via the header dropdown selector, already-open file preview windows do not update their displayed font. Only windows opened after the change use the new font. The font selection should apply immediately to all open windows.

**Reproduction steps:**
1. Open one or more files in catscope.
2. Change the font in the header dropdown (e.g., from "Fira Code" to "Ubuntu Mono").
3. Observe that existing windows still display in the old font.

**Expected:** All open windows immediately reflect the new font choice.

**Actual:** Only newly opened windows use the selected font.

## Context

The root cause is in `frontend/js/app.js`. The `applyFont()` function (line 74) sets the CSS custom property `--catscope-mono-font` on the main document, which updates text content in non-iframe elements. However, pretty-print rendered content is displayed inside iframes, and iframes have isolated CSS — they do not inherit the parent document's CSS custom properties.

The `injectFontIntoIframe()` function (line 81) correctly injects `@font-face` declarations and a `font-family` rule into an iframe's document, but it is only called on iframe `onload` events (lines 314, 348). It is never called again when the font selection changes.

### Fix approach

When the font changes, `applyFont()` should iterate over all open windows (`WindowManager.windows`) and re-inject the font into each window's iframe (if it has one). This can be done by:

1. Iterating `WindowManager.windows` in `applyFont()`.
2. For each window, finding its iframe element and calling `injectFontIntoIframe()` on it (or replacing/updating the injected `<style>` element).

### Files affected

- `frontend/js/app.js` — `applyFont()` function (line 74) and font change event handler (line 816)

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: Confirmed: `applyFont()` (line 74) sets the CSS custom property and saves to localStorage but does not iterate over existing windows. `injectFontIntoIframe()` (line 81) is only called on iframe `onload` events (lines 314, 348), never when the font changes. The fix is to iterate `WindowManager.windows` in the font change handler (line 816-818), find each window's iframe, and call `injectFontIntoIframe()` on it. The infrastructure is all in place — `WindowManager.windows` is a simple array, and each window's DOM is accessible. Estimated ~10 lines of new code in `app.js`.
- **Triaged on**: 2026-04-18

## Resolution

Fixed by modifying two functions in `frontend/js/app.js`:

1. **`applyFont()`** now iterates `WindowManager.windows` after setting the CSS custom property and localStorage. For each open window, it finds the iframe inside `contentEl` (if any) and calls `injectFontIntoIframe()` to update the font. Windows without iframes (e.g., image previews) are safely skipped via the `querySelector("iframe")` null check.

2. **`injectFontIntoIframe()`** now uses a stable `id="catscope-font-style"` on the injected `<style>` element. On subsequent calls, it finds the existing style element by ID and updates its `textContent` in place, rather than appending a new `<style>` element each time. This prevents style element accumulation on repeated font changes.

Added an e2e test in `e2e/tests/font-selector.spec.ts` that opens a text file, changes the font selector, and verifies the iframe's injected style element reflects the new font family.
