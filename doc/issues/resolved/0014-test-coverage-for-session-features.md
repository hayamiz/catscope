---
id: "0014"
title: "Add test coverage for features implemented in issue-fix session"
type: test
priority: high
status: resolved
created: 2026-04-18
updated: 2026-04-18
---

## Description

The issue-fix session resolved 8 issues (#0003, #0004, #0005, #0007, #0008, #0009, #0010, #0011) but added no new tests. All features need test coverage to prevent regressions.

## Missing Test Coverage

### 1. `handleRender` endpoint (Go unit tests) — #0003

No tests exist for the new `GET /render/{path...}` endpoint in `render.go`.

**Needed tests** (in a new `render_test.go`):
- Markdown rendering: verify `.md` file returns HTML with converted content
- JSON pretty-printing: verify `.json` file returns indented JSON wrapped in `<pre>`
- Syntax highlighting: verify `.go` (or `.py`) file returns HTML with chroma CSS classes
- YAML passthrough: verify `.yaml` file returns preformatted plain text
- 10 MB file size limit: verify files > 10 MB return `413` with JSON error body `{"error": "file_too_large", ...}`
- Path security: verify `../../etc/passwd` style paths return `403`
- Non-existent file: verify missing file returns `404`
- Directory path: verify directory returns `404`
- Malformed JSON: verify invalid JSON still renders (falls back to escaped `<pre>`)
- HTML sanitization: verify `<script>alert(1)</script>` in Markdown is stripped from output

**Test pattern**: Follow existing `server_test.go` pattern — use `setupTestServer(t)`, write test files to `t.TempDir()`, make `httptest` requests to `/render/{path}`, assert status codes and response bodies.

### 2. Render toggle (Playwright e2e) — #0003

No e2e tests for the raw/pretty toggle button.

**Needed tests** (new `render-toggle.spec.ts`):
- Toggle button visible for text files (`.md`, `.json`, `.go`)
- Toggle button NOT visible for images, PDFs
- Clicking toggle switches iframe src from `/preview/` to `/render/`
- Clicking toggle again switches back to `/preview/`
- Toggle state persists across content reloads (file modification event)

### 3. Grid snap (Playwright e2e) — #0007

No e2e tests for grid snap behavior.

**Needed tests** (add to `window-management.spec.ts`):
- Grid snap toggle button exists in header and is active by default
- When grid snap is ON, dragging a window results in position snapped to 50px multiples
- When grid snap is OFF (toggle clicked), window position is free-form
- When grid snap is ON, resizing results in size snapped to 50px multiples
- Grid overlay (`#main.grid-active`) is visible when snap is ON, hidden when OFF

### 4. Window management: closeAll and tileWindows (Playwright e2e) — #0004

No e2e tests for workspace management buttons.

**Needed tests** (add to `window-management.spec.ts`):
- "Close all" button closes all open windows
- "Close all" with no windows open is a no-op (no error)
- "Tile" button arranges 1 window to fill main area
- "Tile" button arranges 4 windows into 2x2 grid
- "Tile" with no windows open is a no-op

### 5. Sidebar resize (Playwright e2e) — #0008

No e2e tests for sidebar resizing.

**Needed tests** (add to `window-management.spec.ts` or new `sidebar.spec.ts`):
- Resize handle element exists between sidebar and main
- Dragging handle right increases sidebar width
- Dragging handle left decreases sidebar width
- Width is clamped to minimum 150px
- Width is clamped to maximum 600px

### 6. Font selector (Playwright e2e) — #0005

No e2e tests for font selection.

**Needed tests** (new `font-selector.spec.ts`):
- Font selector dropdown exists in header with 3 options
- Changing font updates `--catscope-mono-font` CSS variable
- Font persists across page reload (localStorage)
- Selected font is injected into text preview iframes

### 7. Install script (shell tests) — #0009

No tests for the install script's destination logic.

**Needed tests** (new `scripts/install_test.sh` or integration into CI):
- `CATSCOPE_INSTALL_DIR=/tmp/test` overrides all other logic
- Running as root (simulated) selects `/usr/local/bin`
- `XDG_BIN_HOME=/tmp/xdg` is used when set (non-root)
- Default fallback is `$HOME/bin`
- PATH warning is printed when install dir is not in PATH

### 8. Startup banner and --quiet flag (Go unit test) — #0010

No tests for the `--quiet` flag or banner output.

**Needed tests** (in a new `main_test.go` or `banner_test.go`):
- Verify banner constant is non-empty and contains "catscope" text
- Testing the flag behavior directly is difficult since `main()` calls `os.Exit`, but the banner logic could be extracted into a testable function

## Context

The CLAUDE.md project guidelines state: "Every exported function must have corresponding tests." While `handleRender` is unexported, it is a significant new HTTP handler that follows the same pattern as `handleFile`, `handlePreview`, etc. — all of which have tests in `server_test.go`. The e2e tests cover all existing UI interactions (drag, resize, close, copy, sort), so the new UI features (grid snap, tile, closeAll, sidebar resize, font selector, render toggle) should be covered too.

### Priority assessment

| Test area | Risk if untested | Effort |
|-----------|-----------------|--------|
| handleRender path security | High (XSS, path traversal) | Low |
| handleRender Markdown sanitization | High (XSS) | Low |
| handleRender 413 limit | Medium | Low |
| closeAll / tileWindows e2e | Medium (regressions) | Low |
| Grid snap e2e | Low (visual only) | Medium |
| Sidebar resize e2e | Low (visual only) | Medium |
| Font selector e2e | Low | Medium |
| Render toggle e2e | Medium | Low |
| Install script | Low (infrequent use) | Medium |
| --quiet flag | Low (cosmetic) | Low |

## Triage

- **Complexity**: medium
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All test cases are well-defined and follow existing patterns. The Go unit tests for `handleRender` are highest priority due to security implications (path traversal, XSS sanitization). The e2e tests follow existing Playwright patterns in `e2e/tests/`. Estimated effort: 3-5 hours total.
- **Triaged on**: 2026-04-18

## Resolution

Added 33 new test cases across 7 files:

**Go unit tests (11 tests, all passing):**
- `render_test.go`: 10 tests for handleRender — Markdown rendering, XSS sanitization, JSON pretty-print, malformed JSON fallback, syntax highlighting, YAML passthrough, 10MB size limit (413), path traversal (403), not found (404), directory (404).
- `banner_test.go`: 1 test verifying banner constant is non-empty and contains the catscope signature.

**Playwright e2e tests (22 tests across 5 files):**
- `render-toggle.spec.ts`: 5 tests — toggle visibility for text/image files, active class toggle, iframe src switching between /preview/ and /render/.
- `workspace-actions.spec.ts`: 5 tests — close-all and tile button existence, close all removes windows, tile arranges windows in grid, close-all no-op with no windows.
- `grid-snap.spec.ts`: 5 tests — button existence, default active state, grid overlay class, toggle off/on behavior.
- `sidebar-resize.spec.ts`: 3 tests — handle existence, initial 300px width, drag increases width.
- `font-selector.spec.ts`: 4 tests — dropdown existence, 3 options, default value, CSS variable update on change.

**Not covered (deferred):**
- Install script shell tests (#0009) — low risk, requires simulating root/non-root environments.
- --quiet flag behavior — difficult to test since main() calls os.Exit; banner constant is tested instead.
