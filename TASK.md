# Catscope v2 Implementation Tasks

## 1. Project Setup

- [x] Initialize Go module (`go.mod`) with dependencies (`nhooyr.io/websocket`, `github.com/fsnotify/fsnotify`)
- [x] Create directory structure (`frontend/`, `frontend/css/`, `frontend/js/`, `frontend/icons/`)
- [x] Set up `go:embed` for frontend assets

## 2. CLI and Server Startup (`main.go`)

- [x] Parse CLI flags: `--bind` (`-o`), `--port` (`-p`), `--version` (`-v`)
- [x] Resolve `TOP_DIR` (absolute path of cwd with symlinks resolved)
- [x] Print startup message (version, serving directory, listen address)
- [x] Display warning when binding to `0.0.0.0`
- [x] Start HTTP server

## 3. Path Resolution and Security (`pathutil.go`)

- [x] Implement path resolution: strip leading `/`, join with `TOP_DIR`, canonicalize via `filepath.Abs` + `filepath.EvalSymlinks`
- [x] Implement path traversal prevention: verify resolved path starts with `TOP_DIR`
- [x] Return `403 Forbidden` for paths outside `TOP_DIR`
- [x] Write thorough tests for path traversal (`pathutil_test.go`)

## 4. MIME Type Mapping

- [x] Implement custom MIME type mapping (see SPEC.md Section 5)
- [x] Fallback to `mime.TypeByExtension`, then `application/octet-stream`
- [x] Case-insensitive extension matching
- [x] Write tests for MIME type mapping

## 5. HTTP Routing and Handlers (`server.go`)

- [x] `GET /` — Serve embedded `index.html`
- [x] `GET /file/{path...}` — Serve raw file with correct MIME type
- [x] `GET /preview/{path...}` — Serve preview (EPS conversion, SVG passthrough, other raw)
- [x] `GET /save/{path...}` — Serve file for download (`Content-Disposition: attachment`)
- [x] `GET /api/lsdir/{path...}` — Return directory listing as JSON
  - [x] Exclude `.` and `..`
  - [x] Include hidden files (dotfiles)
  - [x] Use `/` as path separator
  - [x] Follow symlinks for type detection
  - [x] MD5 hash for `id` field
  - [x] Case-insensitive alphabetical sort by `name`
  - [x] Error responses: 403, 404, 400
- [x] `GET /assets/...` — Serve embedded static assets (CSS, JS, icons)
- [x] Write tests for all handlers (`server_test.go`)

## 6. EPS Conversion (`converter.go`)

- [x] Check for ImageMagick (`convert` command) availability
- [x] Get image dimensions via `identify`
- [x] Implement DPI upscaling logic (threshold: 524,288 px)
- [x] Convert EPS to PNG via `convert`
- [x] Return `501 Not Implemented` with JSON error when ImageMagick is unavailable
- [x] Handle `identify` failure gracefully (convert without DPI)
- [x] Write tests for converter (`converter_test.go`)

## 7. WebSocket and File Watching (`watcher.go`)

- [x] `GET /ws` — WebSocket endpoint using `nhooyr.io/websocket`
- [x] Handle `watch` message: add file to fsnotify watch
- [x] Handle `unwatch` message: remove file from fsnotify watch
- [x] Broadcast `file_modified`, `file_renamed`, `file_deleted` events
- [x] Implement reference counting for watched files
- [x] Debounce file change events (100ms per file)
- [x] Auto-cleanup watches on WebSocket connection close
- [x] Write tests for watcher (`watcher_test.go`)

## 8. Frontend — HTML (`frontend/index.html`)

- [x] Page structure: header, sidebar (file list), main area (preview windows)
- [x] Include embedded CSS and JS references

## 9. Frontend — CSS (`frontend/css/style.css`)

- [x] Overall layout: two-column (sidebar 300px + main area)
- [x] Header styles (background `#008CBA`, white text)
- [x] Sidebar styles (background `#f5f5f5`)
- [x] File list styles (icons, indentation 20px per level, hover effect)
- [x] Preview window styles (border `#b6edff`, title bar `#008CBA` 30px, drop shadow)
- [x] Toast notification styles (bottom-right, green `#5cb85c`, fade-out)

## 10. Frontend — JavaScript (`frontend/js/app.js`)

### 10.1 File List (Directory Tree)

- [x] Fetch root directory on page load via `GET /api/lsdir/`
- [x] Directory expand/collapse on click
- [x] Manage expand state via `data-opened` attribute
- [x] Render directory entries: folder icon + name + refresh button
- [x] Render file entries: file icon + name + download button
- [x] Refresh button: re-fetch directory contents
- [x] Download button: link to `/save/{path}`

### 10.2 Preview Window

- [x] Create preview window on file click
- [x] Cascade placement for new windows (600px × 400px)
- [x] Title bar: file path (ellipsis overflow), copy button (text files only), close button
- [x] Content display: `<img>` for images, `<iframe>` for PDF/text
- [x] EPS error handling (501 → error message + download link)
- [x] Cache busting via `?t={timestamp}`

### 10.3 Window Operations

- [x] Drag move via title bar (Pointer Events API)
- [x] Resize via bottom-right corner (Pointer Events API)
- [x] z-index management (click to bring to front)
- [x] Close button: remove from DOM, send `unwatch`

### 10.4 WindowManager

- [x] `add(win)` / `remove(win)`
- [x] `create(path)` — create and register PreviewWindow
- [x] z-index assignment in array order
- [x] `reloadByPath(path)` — reload all matching windows

### 10.5 Clipboard

- [x] Fetch text content via `/file/{path}` on file open
- [x] Copy to clipboard via `navigator.clipboard.writeText()`
- [x] Toast notification on success (3s auto-dismiss, fade-out)

### 10.6 WebSocket Client

- [x] Connect to `/ws` on page load
- [x] Send `watch` on preview window open
- [x] Send `unwatch` on preview window close
- [x] Handle `file_modified` → reload preview
- [x] Handle `file_renamed` → reload preview
- [x] Handle `file_deleted` → show deletion message
- [x] Auto-reconnect with exponential backoff (1s initial, 30s max)
- [x] Re-send `watch` messages on reconnect

## 11. SVG Icons (`frontend/icons/`)

- [x] `folder.svg`
- [x] `file.svg`
- [x] `download.svg`
- [x] `refresh.svg`
- [x] `close.svg`
- [x] `clipboard.svg`

## 12. Integration Tests (Playwright)

- [x] Set up Playwright project (`e2e/`)
- [x] Directory browsing tests
- [x] File preview tests (images, SVG, PDF, text)
- [x] Download tests
- [x] WebSocket live reload tests
- [x] Window management tests (drag, resize, close, z-order)
- [x] Clipboard copy tests
