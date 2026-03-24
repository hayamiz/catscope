# Catscope v2

A web-based file browser for remote development servers. Serves files from the current directory via HTTP with real-time file change notifications over WebSocket.

## Specification

The authoritative specification is [SPEC.md](SPEC.md). Always consult it for behavioral details.

## Task Tracking

Implementation tasks are tracked in [TASK.md](TASK.md). When an implementation task is completed, check off the corresponding item in TASK.md.

## Language & Style

- All code, comments, commit messages, documentation, and error messages must be written in English.
- Follow standard Go conventions: `gofmt`, `go vet`, `golint`-clean code.
- Use `camelCase` for unexported identifiers, `PascalCase` for exported ones.

## Tech Stack

- **Language**: Go 1.22+
- **HTTP**: `net/http` with Go 1.22 `ServeMux` pattern matching (no framework)
- **WebSocket**: `nhooyr.io/websocket`
- **File watching**: `github.com/fsnotify/fsnotify`
- **Static assets**: `go:embed`
- **CLI**: `flag` (stdlib)
- **Templates**: `html/template` (stdlib)

## Project Structure

```
catscope/
├── main.go              # Entry point, CLI parsing, server startup
├── server.go            # HTTP routing, handlers
├── watcher.go           # File watching, WebSocket management
├── converter.go         # EPS conversion (optional ImageMagick)
├── pathutil.go          # Path resolution, security validation
├── frontend/            # Frontend assets (go:embed target)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── icons/*.svg
├── *_test.go            # Unit tests
├── e2e/                 # Playwright integration tests
│   ├── package.json
│   ├── playwright.config.ts
│   └── tests/
├── go.mod
├── go.sum
├── SPEC.md              # Authoritative specification
├── TASK.md              # Implementation task tracking
└── CLAUDE.md            # This file
```

## Build & Run

```bash
# Build
go build -o catscope .

# Run (serves current directory on http://127.0.0.1:4567)
./catscope

# Release build (version from VERSION file)
go build -ldflags="-s -w -X main.version=$(cat VERSION)" -o catscope .
```

## Testing

### Unit Tests

```bash
# Run all tests
go test ./...

# Run with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run a specific test
go test -run TestPathResolution ./...
```

- Every exported function must have corresponding tests.
- Table-driven tests are preferred.
- Use `t.Helper()` in test helper functions.
- Use `testdata/` directories for test fixtures.
- Path security validation (path traversal prevention) must have thorough test coverage.

### Integration Tests (Playwright)

```bash
cd e2e
npm install
npx playwright install
npx playwright test
```

- Tests run against a live catscope server started in a temporary directory.
- Cover: directory browsing, file preview (images, SVG, PDF, text), download, WebSocket live reload, window management (drag, resize, close, z-order), clipboard copy.
- Use `test.describe` to group related scenarios.
- Each test should be independent (no shared state between tests).

## Key Design Decisions

### Path Security
All file-serving endpoints MUST validate that the resolved absolute path starts with `TOP_DIR`. Use `filepath.Abs` + `filepath.EvalSymlinks` for canonicalization. Return 403 for any path outside `TOP_DIR`. This is the most security-critical code path — test exhaustively.

### SVG Handling
SVG files are served as-is with `Content-Type: image/svg+xml`. No server-side conversion.

### EPS Handling
EPS conversion is optional. When ImageMagick is not available, return `501 Not Implemented` with a JSON error body. Never panic or crash on missing ImageMagick.

### WebSocket
- Single endpoint at `/ws`.
- JSON messages: `{"type": "...", "path": "..."}`.
- Implement reference counting for watched files.
- Debounce file change events at 100ms per file.
- Auto-cleanup watches when a WebSocket connection closes.

### Frontend
- Vanilla JS only — no frameworks, no jQuery, no build tools.
- All assets are embedded via `go:embed` and served from memory.
- Zero CDN dependencies — everything works offline.
- Use Pointer Events API for drag/resize.
- Use Clipboard API for copy.

## Code Quality

- Run `go vet ./...` before committing — it must pass cleanly.
- Run `go test ./...` before committing — all tests must pass.
- Do not ignore errors. Handle every error explicitly or document why it is safe to ignore with a comment.
- Use `context.Context` for cancellation in long-running operations.
- Use `slog` (Go 1.21+) for structured logging.
- Prefer returning errors over panicking.

## Git Conventions

- Branch: `catscope-dev-v2`
- Write concise commit messages in English, imperative mood (e.g., "Add WebSocket file watcher").
- Keep commits focused — one logical change per commit.

## Dev Container

- When adding or changing project dependencies (system packages, Go version, Node.js version, etc.), always update `.devcontainer/Dockerfile` accordingly to keep the container environment in sync.
