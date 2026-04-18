---
id: "0001"
title: "Text file preview breaks whitespace alignment (ASCII art, indentation)"
type: bug
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

When previewing text files (`.md`, `.txt`, etc.) that contain ASCII art or indentation-sensitive content, whitespace alignment is broken. Multiple consecutive spaces are collapsed and box-drawing characters no longer line up, making diagrams unreadable.

**Root cause**: The text content is inserted into the DOM via `textContent` on a plain `<div>`, where the default CSS `white-space` behavior collapses runs of spaces. Although the preview area uses a monospace font (`font-family: "SFMono-Regular", Consolas, ...`), the lack of `white-space: pre` (or a `<pre>` element) means that consecutive spaces and line structure are not preserved faithfully by the browser.

**Expected behavior**: Text file previews should render with a monospace font and preserve all whitespace exactly as it appears in the source file — consecutive spaces, leading indentation, and blank lines must all be kept intact so that ASCII art, tables, and structured text display correctly.

**Actual behavior**: Spaces are collapsed, box-drawing lines misalign, and indentation structure is lost. See the attached screenshot for an example of a Markdown file with ASCII art diagram where the tree structure is completely broken.

## Context

- The preview content area (`.preview-content`) already has `font-family` set to a monospace stack and `white-space: nowrap` in CSS, but `nowrap` only prevents line wrapping — it does not preserve space runs in all DOM insertion modes.
- The text is inserted via JavaScript (`self.contentEl.textContent = ...` or `innerHTML` with an `<iframe>`), and the exact insertion method determines whether whitespace is preserved.
- This affects all text file types (`.md`, `.txt`, `.log`, `.yaml`, `.yml`, `.toml`, `.json`, `.xml`, `.html`, `.css`, `.js`, etc.) — any file where the content relies on exact whitespace alignment.
- A simple fix would be to wrap text content in a `<pre>` element or apply `white-space: pre` to the content container when displaying text files.

## Triage

- **Complexity**: low (if bug is confirmed) / possibly invalid
- **Mechanical fix**: yes (if bug is confirmed)
- **Requires user decision**: yes — need reproduction to confirm the bug exists
- **Analysis**: The description contains several inaccuracies about the current code that cast doubt on whether this bug exists as described:
  1. **Claim: "text content is inserted into the DOM via `textContent` on a plain `<div>`"** — Incorrect. Text files are rendered via an `<iframe>` with `src="/preview/{path}"` (app.js lines 231-234). The content is NOT inserted via `textContent` on a div.
  2. **Claim: "`.preview-content` already has `white-space: nowrap`"** — Incorrect. The `.preview-content` class has no `white-space` property at all (style.css lines 164-170). The `white-space: nowrap` property exists on `.dir-entry` and `.preview-title`, not on `.preview-content`.
  3. **Claim: CSS `white-space` collapses spaces** — The `.preview-content iframe` CSS (style.css lines 172-177) only styles the iframe element itself (dimensions, border, background). CSS does not cross iframe boundaries, so no CSS property on `.preview-content` or `.preview-content iframe` can affect whitespace rendering of content inside the iframe.
  4. **How text actually renders**: The `/preview/` endpoint serves text files with `Content-Type: text/plain; charset=utf-8` (via `mimeTypeForFilePath()` in mimetype.go). When a browser loads `text/plain` content in an iframe, it natively renders the text with whitespace preserved (browsers internally wrap plain text in a `<pre>` element). This means whitespace alignment should already be correct for `.txt`, `.md`, `.log`, `.yaml`, `.yml`, `.toml`, and other `text/plain` files.
  5. **Possible edge case**: Files served as `text/html` (e.g., `.html` files) would have whitespace collapsed by the browser's HTML parser, but that is correct behavior for HTML files. Files detected as text via content-sniffing fallback also get `text/plain`, so they should be fine too.
  
  **Conclusion**: The bug as described does not appear to match the current codebase. The previous triage (2026-04-17) suggesting "add `white-space: pre-wrap` to the iframe content styling" would have no effect because CSS cannot cross iframe boundaries. Before implementing a fix, the bug needs to be reproduced with a specific file to determine whether it actually occurs and, if so, what the true root cause is. If the bug can be reproduced, the fix would likely need to be either (a) server-side: wrapping text content in a minimal HTML page with `<pre>` styling when served via `/preview/`, or (b) client-side: switching text preview from iframe-based to direct DOM insertion with `<pre>` elements (similar to how CSV/TSV files are handled).
- **Triaged on**: 2026-04-18

## Resolution

Resolved during font adjustment work. The whitespace alignment issue was addressed as part of the font bundling and rendering improvements. Closed per user confirmation.
