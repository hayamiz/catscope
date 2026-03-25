# Catscope v2 Specification

> **Implementation Status Legend**: Sections are marked with status indicators:
> - ✅ = Fully implemented and tested
> - ⚠️ = Partially implemented
> - ❌ = Not yet implemented

## 1. Overview ✅

Catscope v2 is a web-based file browser that runs on remote environments such as development servers, allowing users to browse files (images, PDF, SVG, text, etc.) from a web browser.

It can be distributed as a single binary and operates without any external tool dependencies.

- **Language**: Go
- **License**: MIT
- **Supported Platforms**: Linux amd64 (additional platforms may be added in the future)
- **Distribution**: Single binary (all frontend assets embedded via `go:embed`)
- **External Dependencies**: None (ImageMagick is optionally required for EPS conversion only)
- **Repository**: `github.com/hayamiz/catscope`

---

## 2. Command-Line Interface ✅

### 2.1 Usage ✅

```
catscope [options]
```

Starts the server and makes files under the current directory browsable via a web browser.

### 2.2 Options ✅

| Option | Short | Default | Description | Status |
|---|---|---|---|---|
| `--bind ADDRESS` | `-o` | `127.0.0.1` | IP address to bind to | ✅ |
| `--port PORT` | `-p` | `4567` | Port number to listen on | ✅ |
| `--directory DIR` | `-C` | `.` (current directory) | Directory to serve files from | ✅ |
| `--version` | `-v` | - | Display version and exit | ✅ |
| `--system-update` | - | - | Self-update the binary to the latest release (see Section 12) | ✅ |

### 2.3 Root Directory ✅

By default, the absolute path of the current working directory at server startup (with symlinks resolved) becomes the root directory for file serving (`TOP_DIR`). If the `--directory` (`-C`) option is specified, the given directory is used instead. In either case, the path is canonicalized via `filepath.Abs` + `filepath.EvalSymlinks`. If the specified directory does not exist or is not a directory, the server prints an error and exits with a non-zero status. All file paths are handled as relative paths from `TOP_DIR`.

### 2.4 Startup Output ✅

The following information is printed to stdout at startup:

```
Catscope v2.x.x
Serving files from: /path/to/top_dir
Listening on: http://127.0.0.1:4567
```

---

## 3. HTTP API ✅

### 3.1 Main Page ✅

#### `GET /`

Returns the file browser SPA (Single Page Application).

- **Response**: HTML
- **Content-Type**: `text/html; charset=utf-8`
- **Content**: `index.html` embedded via `go:embed`. All CSS/JS are served inline or as separate assets

### 3.2 File Serving Endpoints ✅

#### `GET /file/{path...}`

Returns the specified file as-is (raw data).

- **Path Resolution**: Resolves `{path}` relative to `TOP_DIR` (see "4. Path Resolution and Security" for details)
- **Content-Type**: MIME type based on file extension (see "5. MIME Type Mapping" for details)
- **Response**: Streams the raw file data
- **Errors**:
  - Path points outside `TOP_DIR`: `403 Forbidden`
  - File does not exist: `404 Not Found`

#### `GET /preview/{path...}`

Returns preview data for a file.

- **Path Resolution**: Same as `/file/`
- **For EPS files** (optional conversion):
  1. Check for the presence of the `convert` command (ImageMagick)
  2. If available:
     a. Get image dimensions (width x height) using the `identify` command
     b. If pixel count is below the threshold (524,288 = 1024x1024/2), increase DPI for upscaling
        - Formula: `dpi = floor(72 × sqrt(524288 / (width × height)))`
     c. Convert to PNG using `convert [-density {dpi}] "{path}" png:-` and return
     d. Content-Type: `image/png`
  3. If not available:
     - Content-Type: `application/json`
     - Response: `{"error": "conversion_unavailable", "message": "ImageMagick is not installed. EPS preview is not available."}`
     - Status Code: `501 Not Implemented`
- **For SVG files**: Served as-is (Content-Type: `image/svg+xml`)
- **For other files**: Returns raw data, same as `/file/`

#### `GET /save/{path...}`

Returns the file for download.

- **Path Resolution**: Same as `/file/`
- **Content-Type**: `application/octet-stream`
- **Content-Disposition**: `attachment; filename="{filename}"`
- **Response**: Raw file data

### 3.3 API Endpoints ✅

#### `GET /api/lsdir/{path...}`

Returns directory contents as JSON.

- **Path Resolution**: Resolves relative to `TOP_DIR`
- **Content-Type**: `application/json`
- **Response**: JSON array of entries (sorted by name)

**Response Format**:

```json
[
  {
    "name": "file or directory name",
    "path": "relative path from TOP_DIR",
    "type": "dir or file",
    "id": "MD5 hash of path (hex string)"
  }
]
```

**Specification Details**:
- `.` and `..` are excluded
- Files/directories starting with `.` (hidden files) are included
- Each entry's `path` is a relative path from `TOP_DIR` (using `/` as separator, not the OS path separator)
- `type` is based on the filesystem type (`dir` or `file`). Symbolic links follow the type of their target
- `id` is the MD5 hash of the `path` string (hex string)
- Entries are sorted alphabetically by `name` (case-insensitive)
- **Errors**:
  - Path points outside `TOP_DIR`: `403 Forbidden`
  - Directory does not exist: `404 Not Found`
  - Path is not a directory: `400 Bad Request`

### 3.4 WebSocket Endpoint ✅

#### `GET /ws`

Establishes a WebSocket connection (see "6. Real-Time File Monitoring" for details).

### 3.5 Asset Serving ✅

Serves frontend assets embedded via `go:embed`.

| Path | Content |
|---|---|
| `/assets/css/` | CSS files |
| `/assets/js/` | JavaScript files |
| `/assets/icons/` | SVG icons |

---

## 4. Path Resolution and Security ✅

### 4.1 Path Resolution Rules ✅

1. Converting URL paths to file paths:
   - Strip the leading `/` from the URL path
   - Join the path relative to `TOP_DIR`
   - Canonicalize the resulting path using `filepath.Abs` + `filepath.EvalSymlinks`
2. **Path Traversal Prevention**: Verify that the canonicalized path starts with the `TOP_DIR` prefix. If not, return `403 Forbidden`

### 4.2 Security Policy ✅

- **Default Bind**: `127.0.0.1` (localhost only)
- **Authentication/Authorization**: None (assumes usage within a trusted network)
- When `--bind 0.0.0.0` is used, display a warning in the startup message:
  ```
  WARNING: Binding to 0.0.0.0 - all files in /path/to/top_dir will be accessible from any network host.
  ```

---

## 5. MIME Type Mapping ✅

Determines Content-Type from file extension:

| Extension | Content-Type |
|---|---|
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.svg` | `image/svg+xml` |
| `.webp` | `image/webp` |
| `.pdf` | `application/pdf` |
| `.eps` | `image/png` (when converted) / `application/postscript` (when served raw) |
| `.html`, `.htm` | `text/html; charset=utf-8` |
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.json` | `application/json` |
| `.xml` | `application/xml` |
| `.txt` | `text/plain; charset=utf-8` |
| `.csv` | `text/csv; charset=utf-8` |
| `.tsv` | `text/tab-separated-values; charset=utf-8` |
| `.log` | `text/plain; charset=utf-8` |
| `.md` | `text/plain; charset=utf-8` |
| `.yaml`, `.yml` | `text/plain; charset=utf-8` |
| `.toml` | `text/plain; charset=utf-8` |
| Other | Result of Go standard library `mime.TypeByExtension`; `application/octet-stream` if unknown |

**Extension Detection Rule**: Extract the `.` + alphanumeric suffix at the end of the filename as the extension (case-insensitive).

### 5.1 Content-Based Text Detection Fallback ✅

When extension-based MIME type resolution results in a type that browsers cannot render inline (i.e., not `text/*`, `image/*`, `application/pdf`, `application/json`, `application/xml`, or `application/javascript`), the server performs content-based text detection before serving the file. This covers both completely unknown extensions (`application/octet-stream`) and extensions with non-renderable MIME types (e.g., `.sql` → `application/sql`):

1. Read the first 8,192 bytes of the file
2. The file is considered **text** if every byte is one of:
   - Printable ASCII: `0x20`–`0x7E`
   - Common whitespace: tab (`0x09`), line feed (`0x0A`), carriage return (`0x0D`)
   - High bytes: `0x80`–`0xFF` (valid in UTF-8 multibyte sequences)
3. The file is considered **binary** if any byte is:
   - NUL (`0x00`)
   - Other control characters: `0x01`–`0x08`, `0x0E`–`0x1F`, `0x7F` (DEL)
4. Empty files or files that cannot be read are treated as binary (no fallback)
5. If the content is detected as text, serve with `Content-Type: text/plain; charset=utf-8`
6. Otherwise, serve with `Content-Type: application/octet-stream`

This enables readable preview of files such as `Makefile`, `Dockerfile`, `.gitignore`, `.bashrc`, `.conf`, `.ini`, `.sql`, and other text files with non-standard or non-renderable MIME types.

---

## 6. Real-Time File Monitoring ✅

### 6.1 Communication Method ✅

Uses bidirectional communication via WebSocket.

- **Endpoint**: `/ws`
- **Protocol**: WebSocket (RFC 6455)

### 6.2 WebSocket Message Format ✅

All messages are sent and received in JSON format.

```json
{
  "type": "event name",
  "path": "file path"
}
```

### 6.3 Client → Server Messages ✅

| type | path | Description |
|---|---|---|
| `watch` | Relative path of the file | Sent when a preview window is opened. The server starts monitoring the file |
| `unwatch` | Relative path of the file | Sent when a preview window is closed. The server stops monitoring the file |
| `watch_dir` | Relative path of the directory (empty string for root) | Sent when a directory is expanded in the file tree. The server starts monitoring the directory for content changes (file creation, deletion, renaming) |
| `unwatch_dir` | Relative path of the directory (empty string for root) | Sent when a directory is collapsed in the file tree. The server stops monitoring the directory |

### 6.4 Server → Client Messages ✅

| type | path | Description |
|---|---|---|
| `file_modified` | Relative path of the file | File has been modified |
| `file_renamed` | Relative path of the file | File has been renamed |
| `file_deleted` | Relative path of the file | File has been deleted |
| `dir_changed` | Relative path of the directory (empty string for root) | A file or subdirectory was created, deleted, or renamed within the directory. The client should re-fetch the directory contents |

### 6.5 File Monitoring Behavior ✅

- Uses Go's `fsnotify` library (Linux: inotify, macOS: kqueue, Windows: ReadDirectoryChangesW)
- On `watch` received: Add the file to `fsnotify` watch targets
- On `unwatch` received: Remove from watch targets
- On `watch_dir` received: Add the directory to `fsnotify` watch targets for directory content change monitoring
- On `unwatch_dir` received: Remove the directory from watch targets
- On file change event detection: Broadcast notification to all WebSocket clients watching that file
- On directory content change (Create, Remove, Rename events): Broadcast `dir_changed` notification to all WebSocket clients watching that directory
- When multiple clients watch the same file or directory, manage with reference counting; remove from `fsnotify` only when all clients have sent `unwatch`/`unwatch_dir`
- On WebSocket connection close: Automatically treat all files and directories watched by that connection as `unwatch`/`unwatch_dir`

### 6.6 Debounce ✅

Since file change events can fire in rapid succession, debounce notifications for the same file at 100ms intervals.

---

## 7. Frontend Specification ✅

### 7.1 Technology Stack ✅

- **JavaScript**: Vanilla JS (no framework)
- **CSS**: Custom CSS (no framework)
- **WebSocket**: Native `WebSocket` API
- **Clipboard**: Clipboard API (`navigator.clipboard.writeText()`)
- **Icons**: Inline SVG
- **Drag/Resize**: Vanilla JS (Pointer Events API)

### 7.2 Page Structure ✅

The main page consists of:
- Header: App name "Catscope"
- Sidebar (left): File list (directory tree)
- Main area (right): Preview window display area

### 7.3 File List (Directory Tree) ✅

**Initial Display**: On page load, fetch the root directory (`/`) contents via `GET /api/lsdir/` and render the list.

**Directory Expand/Collapse**:
- Clicking a directory name calls `GET /api/lsdir/{path}` to fetch and display child elements (expand)
- Clicking again removes child elements (collapse)
- Expand state is managed via the DOM `data-opened` attribute

**Entry Components**:
- Directory: Folder icon (SVG) + directory name
- File: File icon (SVG) + file name + download button

**Auto-Refresh**: When a directory is expanded, the client sends a `watch_dir` message to the server. When files are created, deleted, or renamed within that directory, the server sends a `dir_changed` message and the client automatically re-fetches and updates the directory contents. When the directory is collapsed, the client sends an `unwatch_dir` message.

**Download Button**: Links to `/save/{path}`. Clicking downloads the file.

### 7.4 Preview Window ✅

Clicking a file name in the file list generates a preview window.

#### 7.4.1 Initial Window State ✅

- Position: Cascade placement within the viewport (each new window is slightly offset from the previous one)
- Size: 600px width × 400px height

#### 7.4.2 Window Components ✅

1. **Title Bar**:
   - File path display (truncated with ellipsis if too long)
   - Clipboard copy button (shown only for text files)
   - Close button
2. **Content Area**: Display area for file contents

#### 7.4.3 Content Display Methods ✅

| File Type | Display Method | Detection Criteria |
|---|---|---|
| Images (JPEG, PNG, GIF, WebP, SVG) | `<img>` element | Extension is an image type |
| EPS (conversion available) | `<img>` element | `/preview/` returns PNG |
| EPS (conversion unavailable) | Error message + download link | `/preview/` returns 501 |
| PDF | `<iframe>` element | `.pdf` extension |
| CSV/TSV | Interactive HTML table | `.csv` or `.tsv` extension (see §7.4.7) |
| Text-based | `<iframe>` element | All others |

- All previews reference `/preview/{path}?t={timestamp}` (cache busting)
- When EPS conversion is unavailable, handle the error response from `/preview/` and display a message "Cannot preview because ImageMagick is not installed" with a download link

#### 7.4.4 Window Operations ✅

- **Drag Move**: Drag the title bar to move the window (using Pointer Events API)
- **Resize**: Drag the bottom-right corner to resize the window (using Pointer Events API). Content area height is recalculated on resize
- **Focus (z-index management)**: Clicking a window brings it to the front. WindowManager manages z-index for all windows
- **Close**: Clicking the close button removes the window from the DOM. Sends an `unwatch` message to the server

#### 7.4.5 Clipboard Copy Feature ✅

- Uses Clipboard API (`navigator.clipboard.writeText()`)
- Enabled for text files. The frontend sends a `HEAD` request to `/file/{path}` and checks the `Content-Type` response header. If the Content-Type starts with `text/` or is `application/json`, `application/xml`, or `application/javascript`, the file is treated as text
  - This covers both files with known text extensions and files detected as text via content-based sniffing (see Section 5.1)
- On file open, fetches text content from `/file/{path}` via `fetch`
- Copy button is added dynamically after the Content-Type check completes
- On copy button click, writes to the clipboard
- On successful copy, displays a toast notification (auto-dismissed after 3 seconds)

#### 7.4.7 CSV/TSV Table Viewer ✅

CSV (`.csv`) and TSV (`.tsv`) files are displayed as interactive HTML tables instead of raw text in iframes.

- **Parsing**: The frontend fetches the raw file content from `/file/{path}` and parses it client-side. CSV uses comma as delimiter; TSV uses tab
- **Header Row**: The first row is treated as column headers, rendered in `<thead>` with distinct styling (blue background matching the app theme, white text, sticky positioning)
- **Striped Rows**: Table body rows alternate background color (even rows highlighted) for readability
- **Row Hover**: Rows highlight on mouse hover
- **Column Sort**: Clicking a column header sorts the table by that column. Clicking again toggles between ascending and descending order. A sort indicator arrow (▲/▼) is displayed in the active header cell. Sorting uses numeric comparison when possible, falling back to locale-aware string comparison
- **Monospace Font**: Table uses monospace font for data alignment
- **Scrollable**: The table wrapper is scrollable both horizontally and vertically for large datasets

#### 7.4.6 Real-Time Updates ✅

- Receives `file_modified`, `file_renamed`, `file_deleted` messages via WebSocket
- `file_modified`: Reloads the content of the corresponding preview window (appends timestamp to `src` for cache busting)
- `file_renamed`: Same as above (reload)
- `file_deleted`: Displays a "File has been deleted" message in the window's content area

### 7.5 WindowManager ✅

An object that manages multiple preview windows.

- **Add/Remove Windows**: `add(win)` / `remove(win)`
- **Create Windows**: `create(path)` - Creates a PreviewWindow and adds it to management
- **z-index Management**: Moves the clicked window to the end of the array and assigns z-index in array order
- **Reload by Path**: `reloadByPath(path)` - Reloads all windows matching the specified path

### 7.6 WebSocket Connection Management ✅

- Establishes a WebSocket connection to `/ws` on page load
- Auto-reconnects on disconnect (initial 1 second, then exponential backoff, max 30 seconds)
- On reconnect, re-sends `watch` messages for all currently monitored files and `watch_dir` messages for all expanded directories

### 7.7 Toast Notifications ✅

- Displayed at the bottom-right of the screen
- Auto-dismissed after 3 seconds
- Includes fade-out animation

---

## 8. External Tool Dependencies (Optional) ✅

### 8.1 ImageMagick (Optional) ✅

Used only for EPS file preview conversion.

- `identify`: Get image dimensions (width x height)
- `convert`: Image format conversion (EPS → PNG)

**When ImageMagick is not installed**: Only EPS file preview is unavailable. All other features operate normally.

### 8.2 EPS Upscaling Logic (When Using ImageMagick) ✅

To improve visibility of small EPS images, DPI is automatically adjusted based on pixel count:

1. Threshold: 524,288 px (= 1024×1024÷2)
2. If `width × height < threshold`:
   - `dpi = floor(72 × sqrt(524288 / (width × height)))`
   - Convert with `convert -density {dpi} "{path}" png:-`
3. If at or above threshold:
   - Convert without DPI specification (default 72dpi)
4. If `identify` fails:
   - Attempt conversion without DPI specification

---

## 9. UI Styling ⚠️

### 9.1 Overall Layout ⚠️

- **Layout**: Two-column with sidebar (file list) + main area (preview windows) ✅
- **Sidebar Width**: 300px (resizable) — ❌ resize handle not yet implemented
- **Font**: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) ✅

### 9.2 Color Palette ✅

| Element | Color |
|---|---|
| Header background | `#008CBA` |
| Header text | `#ffffff` |
| Sidebar background | `#f5f5f5` |
| Preview window border | `#b6edff` |
| Preview window title bar | `#008CBA` |
| Preview window background | `#ffffff` |
| Window drop shadow | `0 0 5px 3px rgba(0,0,0,0.4)` |
| Toast notification (success) | `#5cb85c` |

### 9.3 File List Styles ✅

- Directory: Folder icon (inline SVG) + name
- File: File icon (inline SVG) + name
- Indentation: 20px left padding per nesting level
- On hover: Slightly change background color

### 9.4 Preview Window Styles ✅

- **Window Frame**: `position: absolute`, white background, border color `#b6edff`, drop shadow
- **Title Bar**: Background color `#008CBA`, height `30px`, white text
- **Title Text**: Font size `14px`, `text-overflow: ellipsis` on overflow
- **Content (iframe)**: `width: 100%`, `height: 100%`, white background, monospace font (for text display)
- **Content (img)**: `max-width: 100%`, `max-height: 100%`, `object-fit: contain`

---

## 10. Build and Project Structure ✅

### 10.1 Directory Structure ✅

```
catscope-v2/
├── main.go                  # Entry point, CLI parsing, server startup
├── server.go                # HTTP routing, handlers
├── watcher.go               # File watching, WebSocket management
├── converter.go             # EPS conversion (ImageMagick invocation)
├── pathutil.go              # Path resolution, security validation
├── frontend/                # Frontend assets (go:embed target)
│   ├── index.html           # Main page
│   ├── css/
│   │   └── style.css        # Stylesheet
│   ├── js/
│   │   └── app.js           # Main JavaScript
│   └── icons/
│       ├── folder.svg
│       ├── file.svg
│       ├── download.svg
│       ├── close.svg
│       └── clipboard.svg
├── go.mod
├── go.sum
└── README.md
```

### 10.2 Build Instructions ✅

```bash
# Standard build
go build -o catscope .

# Release build (size optimized)
go build -ldflags="-s -w" -o catscope .

# Cross-compilation examples
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o catscope-linux-amd64 .
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o catscope-darwin-arm64 .
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o catscope-windows-amd64.exe .
```

### 10.3 Go Dependencies ✅

| Library | Purpose |
|---|---|
| `nhooyr.io/websocket` | WebSocket server |
| `github.com/fsnotify/fsnotify` | File system monitoring |

All other dependencies use Go standard library only (`net/http`, `html/template`, `encoding/json`, `crypto/md5`, `flag`, `path/filepath`, `os/exec`, etc.).

---

## 11. Verification Checklist

### 11.1 Basic Functionality

- [x] `go build` produces a single binary
- [x] Running `./catscope` starts the server and the file tree is displayed in the browser
- [x] `--bind`, `--port`, `--version` options work correctly
- [x] Warning message is displayed when using `--bind 0.0.0.0`

### 11.2 File Operations

- [x] Directory expand/collapse works
- [x] Directory tree auto-refreshes when files are created, deleted, or renamed
- [x] Clicking a file opens a preview window
- [x] Download button downloads the file

### 11.3 Preview

- [x] PNG, JPEG, GIF, WebP are displayed with `<img>`
- [x] SVG is natively displayed with `<img>`
- [x] PDF is displayed with the browser's built-in viewer via `<iframe>`
- [x] Text files (txt, csv, log, etc.) are displayed via `<iframe>`
- [x] EPS is displayed as a PNG-converted preview in environments with ImageMagick
- [x] EPS shows an error message + download link in environments without ImageMagick

### 11.4 Window Operations

- [x] Preview windows can be dragged to move
- [x] Preview windows can be resized
- [x] Clicking a window brings it to the front
- [x] Close button closes the window

### 11.5 Clipboard

- [x] Copy button works for text files
- [x] Toast notification is displayed on successful copy

### 11.6 Real-Time Updates

- [x] Preview auto-updates when a file is modified
- [x] Auto-reconnects when WebSocket disconnects
- [x] File monitoring is restored after reconnection

### 11.7 Security

- [x] Files outside `TOP_DIR` cannot be accessed (path traversal via `../`, etc.)
- [x] Default binding is `127.0.0.1`

### 11.8 Installation and Self-Update ✅

- [x] One-liner install command downloads the latest release and places it at `~/bin/catscope`
- [x] `--system-update` detects the running binary's path via `/proc/<PID>`
- [x] `--system-update` succeeds when the binary is writable
- [x] `--system-update` prints an error and exits when the binary is not writable
- [x] `--system-update` replaces the binary with the latest release from GitHub

---

## 12. Installation and Self-Update ✅

### 12.1 Supported Platforms

- Linux amd64 (additional platforms may be added in the future)

### 12.2 Installation

Release binaries are published on GitHub Releases at `github.com/hayamiz/catscope`. The recommended installation method is a one-liner using `curl` that downloads the latest release and installs it to `~/bin/catscope`:

```bash
curl -fsSL https://github.com/hayamiz/catscope/releases/latest/download/catscope-linux-amd64 -o ~/bin/catscope && chmod +x ~/bin/catscope
```

Prerequisites:
- `~/bin/` must exist (or be created beforehand)
- `~/bin/` should be in the user's `PATH`

### 12.3 Self-Update (`--system-update`)

Running `catscope --system-update` updates the binary in-place to the latest release.

**Behavior**:

1. Determine the absolute path of the currently running binary by reading `/proc/<PID>/exe` (where `<PID>` is the process's own PID)
2. Check that the binary file is writable by the current user
   - If not writable: print an error message (e.g., `Error: cannot update <path>: permission denied`) and exit with a non-zero status
3. Fetch the latest release binary from GitHub Releases (`https://github.com/hayamiz/catscope/releases/latest/download/catscope-linux-amd64`)
4. Replace the running binary at the resolved path with the downloaded binary
   - Write to a temporary file in the same directory first, then atomically rename to avoid corruption on failure
5. Preserve the original file permissions
6. Print the updated version on success (e.g., `Updated catscope to v2.x.x`)

**Notes**:
- This feature relies on `/proc/<PID>/exe`, which is Linux-specific
- No restart is performed after the update; the user must re-run catscope manually
