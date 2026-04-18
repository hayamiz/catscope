# Catscope Architecture Overview

A brief document demonstrating various **Markdown** features.

## Components

| Component   | File          | Responsibility              |
|-------------|---------------|-----------------------------|
| Server      | `server.go`   | HTTP routing, static assets |
| Watcher     | `watcher.go`  | fsnotify, WebSocket push    |
| Converter   | `converter.go` | EPS to PNG via ImageMagick |
| Path Utils  | `pathutil.go` | Security validation         |

## Request Flow

```
┌─────────┐       ┌──────────┐       ┌────────────┐
│ Browser │──────▶│  Server  │──────▶│ Filesystem │
│         │◀──────│  (Go)    │◀──────│            │
└─────────┘  HTTP └──────────┘  I/O  └────────────┘
     │                 │
     │  WebSocket      │ fsnotify
     │◀────────────────┘
```

## Code Example

Use `http.HandleFunc` to register routes:

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /api/files/{path...}", handleFiles)
mux.HandleFunc("GET /ws", handleWebSocket)
```

## Build Steps

1. Install Go 1.22 or later
2. Run `go build -o catscope .`
3. Execute `./catscope` in the target directory

> **Note**: All assets are embedded at compile time via `go:embed`.

### Inline Code

The entry point calls `flag.Parse()` then `http.ListenAndServe`.
