---
id: "0003"
title: "Add raw/pretty-print toggle switch to file window title bar"
type: feature
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18

---

## Description

Add a toggle switch to each file window's title bar that allows users to switch between raw data display and a rendered/pretty-printed view. The behavior of the toggle depends on the file type:

| File type | Raw mode | Pretty mode |
|---|---|---|
| Markdown (`.md`) | Plain text | HTML-rendered preview |
| JSON (`.json`, `.jsonl`) | Raw text | Pretty-printed (indented) JSON |
| YAML (`.yaml`, `.yml`) | Raw text | Pretty-printed YAML |
| Source code (`.c`, `.go`, `.sql`, `.js`, `.py`, etc.) | Plain text | Syntax-highlighted code |

The default mode for each file type is TBD (likely raw for most, but could vary).

## Context

Currently, file previews only show raw text content. Adding a pretty-print/render toggle would significantly improve readability for structured file types without losing access to the raw data.

### Key design decisions needed

1. **Client-side vs. server-side rendering**: Rendering could be done entirely in the browser (using JavaScript libraries) or via a server-side API that returns generated HTML. Client-side rendering keeps the server simple and avoids additional dependencies; server-side rendering keeps the frontend lightweight and allows leveraging Go libraries.

2. **Script injection prevention (critical)**: When rendering file content as HTML (especially Markdown preview), user-controlled content must be sanitized to prevent XSS attacks. This includes:
   - Stripping or escaping `<script>` tags, event handlers (`onclick`, `onerror`, etc.), and `javascript:` URIs in Markdown HTML output.
   - Ensuring syntax-highlighted code output is properly escaped.
   - Using a strict Content Security Policy (CSP) if rendering in an iframe or sandboxed context.
   - If server-side, sanitizing HTML output before sending to the client.

3. **Library choices**: If client-side, candidates include libraries like `marked` (Markdown), `highlight.js` or `Prism` (syntax highlighting). However, the current project principle is "vanilla JS only, no frameworks, no build tools, zero CDN dependencies." This constraint needs to be reconciled with the rendering requirements.

## Implementation Notes

### Recommended approach: Server-side rendering

Server-side rendering is recommended to maintain the "vanilla JS, no frameworks, no CDN" constraint.

**New endpoint**: `GET /render/{path}?format=pretty&type={filetype}`

**Go dependencies needed**:
- `github.com/yuin/goldmark` — Markdown to HTML
- `github.com/alecthomas/chroma` — Syntax highlighting
- `github.com/microcosm-cc/bluemonday` — HTML sanitization (XSS prevention)
- `encoding/json` (stdlib) — JSON pretty-printing

**Frontend changes**: Add toggle button to title bar, track raw/pretty state per window, fetch from `/render/` or `/preview/` based on mode.

### Alternative: Client-side rendering

Would require bundling JS libraries (marked, highlight.js, DOMPurify) — conflicts with the vanilla JS / zero CDN constraint. Not recommended unless the constraint is relaxed.

### Resolved decision points

1. **Server-side rendering** — adopted
2. **Go dependencies** — OK to add (goldmark, chroma, bluemonday)
3. **Default mode** — raw for all file types
4. **File size limit** — 10MB; when exceeded, disable toggle button and show size constraint in hover tooltip
5. **State persistence** — no per-file memory needed

## Triage

- **Complexity**: high
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All design decisions are resolved. Verified against the current codebase (2026-04-18):
  - **Backend**: `server.go` has a clean pattern for adding a new `GET /render/{path...}` route alongside the existing `/file/`, `/preview/`, `/save/` handlers. A new `handleRender` function would follow the same path-resolution and security validation pattern used by `handlePreview`. Three new Go dependencies needed (goldmark, chroma, bluemonday); `go.mod` currently only has fsnotify and nhooyr.io/websocket.
  - **Frontend**: In `app.js`, `PreviewWindow.prototype.init` builds the title bar as: title span, copy-button container, close button. The toggle button should be inserted between the copy-button container and the close button. `loadContent()` is the single content-rendering entry point and would branch on the toggle state to fetch from `/preview/` (raw) or `/render/` (pretty). The `detectTextAndEnableCopy` method already performs a HEAD request for Content-Type detection, which can inform whether to show the toggle (only for text-renderable file types).
  - **Scope items**: (1) new `handleRender` handler with goldmark/chroma/bluemonday pipeline, (2) 10MB file size check in the handler returning 413 with JSON error body, (3) toggle button SVG icon added to `frontend/icons/`, (4) toggle button in title bar DOM, (5) `loadContent`/`reload` branching on toggle state, (6) CSS for rendered HTML output (markdown styles, syntax highlighting theme), (7) SPEC.md update with new endpoint documentation, (8) unit tests for render handler, (9) Playwright tests for toggle behavior.
  - No blocking issues or ambiguities remain. Estimated effort: ~7-9 hours.
- **Triaged on**: 2026-04-18

## Resolution

Implemented server-side rendering via new `GET /render/{path...}` endpoint in `render.go`. Added goldmark (Markdown), chroma (syntax highlighting), and bluemonday (XSS sanitization) as Go dependencies. 10 MB file size limit returns 413. Frontend: added `{ }` toggle button in title bar for renderable file types, toggles between `/preview/` (raw) and `/render/` (pretty) modes. Default is raw. Updated SPEC.md with new endpoint, toggle description, and dependency table.