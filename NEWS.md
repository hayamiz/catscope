# Catscope Release Notes

## v2.4.0 (2026-04-18)

Pretty-print preview, window management overhaul, bundled coding fonts, and password authentication.

### Features

- `/render/` endpoint for pretty-printed file preview: Markdown (with GFM table support), JSON pretty-print, syntax highlighting via Chroma, YAML passthrough (#0003)
- Raw/pretty toggle button on text preview windows with SVG code icon (#0003, #0015)
- Password authentication with auto-generated token and `--no-password` opt-out
- Sidebar resize handle with min/max width constraints (#0008)
- Window grid snap with 50px grid and toggle button (#0007)
- Workspace management buttons: "Close All" and "Tile Windows" for arranging open previews (#0004)
- Font selector with three bundled coding webfonts: Fira Code, Ubuntu Mono, Victor Mono (#0005)
- ASCII art startup banner with `--quiet` flag to suppress it (#0010)
- Improved install script with root/XDG/`CATSCOPE_INSTALL_DIR` destination priority (#0009)

### Bug Fixes

- Apply font changes to already-open preview windows (#0019)
- Enable GFM extensions so Markdown tables render correctly (#0017)

### Developer Experience

- Bundled `THIRD_PARTY_LICENSES` file for included webfonts (#0013)
- New e2e tests: render toggle, grid snap, sidebar resize, workspace actions, font selector (22 tests across 5 files)
- New Go unit tests: `render_test.go` (10 tests), `banner_test.go`
- Added `examples/` directory with sample files for manual testing (#0011)
- Issue tracking framework in `doc/issues/`

## v2.3.0 (2026-03-30)

File tree stability and display version in header.

### Features

- Display version number in the page header
- CSV/TSV table viewer with sortable columns and striped rows

### Bug Fixes

- Preserve expanded directory state when the file tree is refreshed via WebSocket (e.g., when a file is created or deleted in an open directory)
- Gracefully handle deletion of an expanded directory without JS errors
- Guard against non-JSON API responses for deleted directories

### Developer Experience

- New e2e tests for expanded directory state preservation (2 tests)

## v2.2.0 (2026-03-25)

New CLI options, content-based text detection, and self-update support.

### Features

- `--directory` (`-C`) option to specify the directory to serve files from
- `--system-update` option to self-update the binary in-place from GitHub Releases
- Content-based text detection for unknown file extensions: files with unrecognized or non-renderable MIME types (e.g., `.sql`, `.conf`, `Makefile`, `Dockerfile`) are inspected and served as `text/plain` if the content is printable text
- Clipboard copy button now works for any file the server detects as text, not just hardcoded extensions

### Bug Fixes

- Fixed `.sql` and other non-renderable MIME types (e.g., `application/sql`) being downloaded instead of previewed as text

### Developer Experience

- Added `lsof` and `iproute2` (`ss`) to dev container
- Added Playwright Chromium browser installation to Dockerfile
- Made e2e test port configurable via `CATSCOPE_TEST_PORT` environment variable
- New e2e tests for unknown extension handling (6 tests)

## v2.1.0 (2026-03-25)

WebSocket directory auto-refresh and developer tooling improvements.

### Features

- WebSocket-based directory auto-refresh: directory tree updates automatically when files are added, removed, or renamed
- Makefile for build, test, lint, and release tasks
- Release script (`scripts/create-release.sh`) for streamlined release creation

### Developer Experience

- Dev container mounts host git and gh config for seamless GitHub access
- Reorganized devcontainer scripts and settings into `etc/` directory
- Documented required GitHub token permissions for `gh release create`

## v2.0.0 (2026-03-24)

Initial Go rewrite of Catscope.

### Features

- Web-based file browser serving files from the current directory
- Single binary distribution with all frontend assets embedded via `go:embed`
- Directory tree with expand/collapse, hidden file support, and refresh
- File preview windows: images (JPEG, PNG, GIF, WebP, SVG), PDF, text files
- EPS preview via optional ImageMagick conversion with DPI upscaling
- Draggable, resizable preview windows with z-index management
- Clipboard copy for text files with toast notifications
- Real-time file change notifications via WebSocket (fsnotify)
- Download files via `/save/` endpoint
- Path traversal prevention with symlink-aware security validation
- CLI options: `--bind` (`-o`), `--port` (`-p`), `--version` (`-v`)
- Custom MIME type mapping for common file extensions
- Vanilla JS frontend with zero external dependencies

### Tech Stack

- Go 1.22+ with `net/http` ServeMux pattern matching
- `nhooyr.io/websocket` for WebSocket
- `github.com/fsnotify/fsnotify` for file watching
- Playwright integration tests (22 tests)
- Go unit tests (27 tests)
