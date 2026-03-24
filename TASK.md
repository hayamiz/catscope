# Catscope v2 Implementation Tasks

## 1. Project Setup

- [ ] Initialize Go module (`go.mod`) with dependencies (`nhooyr.io/websocket`, `github.com/fsnotify/fsnotify`)
- [ ] Create directory structure (`frontend/`, `frontend/css/`, `frontend/js/`, `frontend/icons/`)
- [ ] Set up `go:embed` for frontend assets

## 2. CLI and Server Startup (`main.go`)

- [ ] Parse CLI flags: `--bind` (`-o`), `--port` (`-p`), `--version` (`-v`)
- [ ] Resolve `TOP_DIR` (absolute path of cwd with symlinks resolved)
- [ ] Print startup message (version, serving directory, listen address)
- [ ] Display warning when binding to `0.0.0.0`
- [ ] Start HTTP server

## 3. Path Resolution and Security (`pathutil.go`)

- [ ] Implement path resolution: strip leading `/`, join with `TOP_DIR`, canonicalize via `filepath.Abs` + `filepath.EvalSymlinks`
- [ ] Implement path traversal prevention: verify resolved path starts with `TOP_DIR`
- [ ] Return `403 Forbidden` for paths outside `TOP_DIR`
- [ ] Write thorough tests for path traversal (`pathutil_test.go`)

## 4. MIME Type Mapping

- [ ] Implement custom MIME type mapping (see SPEC.md Section 5)
- [ ] Fallback to `mime.TypeByExtension`, then `application/octet-stream`
- [ ] Case-insensitive extension matching
- [ ] Write tests for MIME type mapping

## 5. HTTP Routing and Handlers (`server.go`)

- [ ] `GET /` — Serve embedded `index.html`
- [ ] `GET /file/{path...}` — Serve raw file with correct MIME type
- [ ] `GET /preview/{path...}` — Serve preview (EPS conversion, SVG passthrough, other raw)
- [ ] `GET /save/{path...}` — Serve file for download (`Content-Disposition: attachment`)
- [ ] `GET /api/lsdir/{path...}` — Return directory listing as JSON
  - [ ] Exclude `.` and `..`
  - [ ] Include hidden files (dotfiles)
  - [ ] Use `/` as path separator
  - [ ] Follow symlinks for type detection
  - [ ] MD5 hash for `id` field
  - [ ] Case-insensitive alphabetical sort by `name`
  - [ ] Error responses: 403, 404, 400
- [ ] `GET /assets/...` — Serve embedded static assets (CSS, JS, icons)
- [ ] Write tests for all handlers (`server_test.go`)

## 6. EPS Conversion (`converter.go`)

- [ ] Check for ImageMagick (`convert` command) availability
- [ ] Get image dimensions via `identify`
- [ ] Implement DPI upscaling logic (threshold: 524,288 px)
- [ ] Convert EPS to PNG via `convert`
- [ ] Return `501 Not Implemented` with JSON error when ImageMagick is unavailable
- [ ] Handle `identify` failure gracefully (convert without DPI)
- [ ] Write tests for converter (`converter_test.go`)

## 7. WebSocket and File Watching (`watcher.go`)

- [ ] `GET /ws` — WebSocket endpoint using `nhooyr.io/websocket`
- [ ] Handle `watch` message: add file to fsnotify watch
- [ ] Handle `unwatch` message: remove file from fsnotify watch
- [ ] Broadcast `file_modified`, `file_renamed`, `file_deleted` events
- [ ] Implement reference counting for watched files
- [ ] Debounce file change events (100ms per file)
- [ ] Auto-cleanup watches on WebSocket connection close
- [ ] Write tests for watcher (`watcher_test.go`)

## 8. Frontend — HTML (`frontend/index.html`)

- [ ] Page structure: header, sidebar (file list), main area (preview windows)
- [ ] Include embedded CSS and JS references

## 9. Frontend — CSS (`frontend/css/style.css`)

- [ ] Overall layout: two-column (sidebar 300px + main area)
- [ ] Header styles (background `#008CBA`, white text)
- [ ] Sidebar styles (background `#f5f5f5`)
- [ ] File list styles (icons, indentation 20px per level, hover effect)
- [ ] Preview window styles (border `#b6edff`, title bar `#008CBA` 30px, drop shadow)
- [ ] Toast notification styles (bottom-right, green `#5cb85c`, fade-out)

## 10. Frontend — JavaScript (`frontend/js/app.js`)

### 10.1 File List (Directory Tree)

- [ ] Fetch root directory on page load via `GET /api/lsdir/`
- [ ] Directory expand/collapse on click
- [ ] Manage expand state via `data-opened` attribute
- [ ] Render directory entries: folder icon + name + refresh button
- [ ] Render file entries: file icon + name + download button
- [ ] Refresh button: re-fetch directory contents
- [ ] Download button: link to `/save/{path}`

### 10.2 Preview Window

- [ ] Create preview window on file click
- [ ] Cascade placement for new windows (600px × 400px)
- [ ] Title bar: file path (ellipsis overflow), copy button (text files only), close button
- [ ] Content display: `<img>` for images, `<iframe>` for PDF/text
- [ ] EPS error handling (501 → error message + download link)
- [ ] Cache busting via `?t={timestamp}`

### 10.3 Window Operations

- [ ] Drag move via title bar (Pointer Events API)
- [ ] Resize via bottom-right corner (Pointer Events API)
- [ ] z-index management (click to bring to front)
- [ ] Close button: remove from DOM, send `unwatch`

### 10.4 WindowManager

- [ ] `add(win)` / `remove(win)`
- [ ] `create(path)` — create and register PreviewWindow
- [ ] z-index assignment in array order
- [ ] `reloadByPath(path)` — reload all matching windows

### 10.5 Clipboard

- [ ] Fetch text content via `/file/{path}` on file open
- [ ] Copy to clipboard via `navigator.clipboard.writeText()`
- [ ] Toast notification on success (3s auto-dismiss, fade-out)

### 10.6 WebSocket Client

- [ ] Connect to `/ws` on page load
- [ ] Send `watch` on preview window open
- [ ] Send `unwatch` on preview window close
- [ ] Handle `file_modified` → reload preview
- [ ] Handle `file_renamed` → reload preview
- [ ] Handle `file_deleted` → show deletion message
- [ ] Auto-reconnect with exponential backoff (1s initial, 30s max)
- [ ] Re-send `watch` messages on reconnect

## 11. SVG Icons (`frontend/icons/`)

- [ ] `folder.svg`
- [ ] `file.svg`
- [ ] `download.svg`
- [ ] `refresh.svg`
- [ ] `close.svg`
- [ ] `clipboard.svg`

## 12. Integration Tests (Playwright)

- [ ] Set up Playwright project (`e2e/`)
- [ ] Directory browsing tests
- [ ] File preview tests (images, SVG, PDF, text)
- [ ] Download tests
- [ ] WebSocket live reload tests
- [ ] Window management tests (drag, resize, close, z-order)
- [ ] Clipboard copy tests
