# Catscope Release Notes

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
