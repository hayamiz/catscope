# Catscope Release Notes

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
