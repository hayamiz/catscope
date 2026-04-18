# Catscope

A web-based file browser for remote development servers. Run a single binary and browse files (images, PDF, SVG, text, EPS, etc.) from your web browser with real-time change notifications.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/hayamiz/catscope/master/scripts/install.sh | sh
```

This downloads the latest release binary to `~/bin/catscope`. Set `CATSCOPE_INSTALL_DIR` to change the install location.

### Build from source

```bash
git clone https://github.com/hayamiz/catscope.git
cd catscope
go build -ldflags="-s -w -X main.version=$(cat VERSION)" -o catscope .
```

## Usage

```bash
catscope
```

Open [http://localhost:4567](http://localhost:4567/) in your browser. Files in the current directory will be browsable.

### Options

| Option | Short | Default | Description |
|---|---|---|---|
| `--bind ADDRESS` | `-o` | `127.0.0.1` | IP address to bind to |
| `--port PORT` | `-p` | `4567` | Port number to listen on |
| `--directory DIR` | `-C` | Current directory | Directory to serve files from |
| `--no-password` | — | — | Skip password authentication |
| `--system-update` | — | — | Self-update the binary to the latest release |
| `--version` | `-v` | — | Display version and exit |

### Binding to all interfaces

```bash
catscope --bind 0.0.0.0
```

**WARNING**: This makes all files in the current directory accessible from any reachable host. Use firewalls or other access controls to restrict connections.

## Features

- **Single binary** — all frontend assets embedded, no external dependencies
- **Directory tree** — expand/collapse with hidden file support
- **File preview** — images (JPEG, PNG, GIF, WebP, SVG), PDF, text files, EPS (with optional ImageMagick)
- **Draggable/resizable windows** — multiple preview windows with z-index management
- **Live reload** — files auto-refresh when modified (WebSocket + fsnotify)
- **Clipboard copy** — one-click copy for text file contents
- **Download** — download any file directly from the browser
- **Security** — path traversal prevention; localhost-only by default

## Optional Dependencies

- **ImageMagick** (`convert`, `identify`) — required only for EPS file preview conversion. All other features work without it.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for dev container setup, build instructions, and release workflow.

## License

MIT
