# Catscope Behavioral Specification

## 1. Overview

Catscope is an on-demand web-based file browser that runs on remote environments such as development servers, allowing users to browse files (images, PDF, text, etc.) from a web browser.

- **Version**: 0.1.6
- **License**: MIT
- **Current Technology Stack**: Ruby / Sinatra / Thin / EventMachine

---

## 2. Command-Line Interface

### 2.1 Usage

```
catscope [options]
```

Starts the server and makes files under the current directory browsable via a web browser.

### 2.2 Options

| Option | Short | Default | Description |
|---|---|---|---|
| `--bind ADDRESS` | `-o` | `127.0.0.1` | IP address to bind to |
| `--port PORT` | `-p` | `4567` | Port number to listen on |
| `--env ENV` | `-e` | `production` | Rack environment name |
| `--version` | `-v` | - | Display version and exit |

### 2.3 Root Directory

The current working directory at server startup (the `realpath` of `Dir.pwd`) becomes the root directory for file serving (`TOP_DIR`). All file paths are handled as relative paths from this directory.

---

## 3. HTTP API

### 3.1 Pages

#### `GET /`

Main page. Returns the file browser HTML.

- Response: HTML (rendered via ERB template)

### 3.2 File Serving Endpoints

#### `GET /file/{path}`

Returns the specified file as-is (raw data).

- **Path Resolution**: Resolves `{path}` relative to `TOP_DIR`
- **Content-Type**: Determined by file extension (see MIME Type Mapping below)
- **Response**: Streams the raw file data

#### `GET /preview/{path}`

Returns preview data for a file. EPS/SVG files are converted to PNG before serving.

- **Path Resolution**: Same as `/file/`
- **Content-Type**: Determined by file extension
- **Special Handling (EPS/SVG)**:
  1. Get image dimensions (width x height) using ImageMagick's `identify` command
  2. If pixel count is below the threshold (524,288 = 1024x1024/2), increase DPI for upscaling
     - Formula: `dpi = floor(72 × sqrt(threshold / (width × height)))`
  3. Convert to PNG using ImageMagick's `convert` command
     - Command: `convert [-density {dpi}] "{path}" png:-`
  4. If `identify` is unavailable, skip dimension retrieval and convert with default DPI
- **Other files**: Returns raw data as-is

#### `GET /save/{path}`

Returns the file for download.

- **Path Resolution**: Same as `/file/`
- **Response**: Returned via `send_file` with headers that prompt the browser to download (Content-Disposition, etc.)

#### `GET /static/{path}`

Returns static files bundled with the application (e.g., ZeroClipboard.swf).

- **Path Resolution**: Resolves relative to the application's `static/` directory
- **Response**: Returned via `send_file`

### 3.3 API Endpoints

#### `GET /api/lsdir/{path}`

Returns directory contents as JSON.

- **Path Resolution**: Resolves `{path}` relative to `TOP_DIR`
- **Content-Type**: `text/json`
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
- Each entry's `path` is a relative path from `TOP_DIR`
- `type` is based on the filesystem type (`dir` or `file`)
- `id` is the MD5 hash of the `path` string, used by the frontend for DOM element identification
- Entries are sorted alphabetically by `name`

### 3.4 Asset Serving

Frontend assets are served under the following path prefixes:

| Path | Source |
|---|---|
| `/assets/img/` | Icon images (folder.png, page_white.png, disk.png, arrow_refresh_small.png) |
| `/assets/js/` | JavaScript files |
| `/assets/stylesheets/` | Compiled CSS |
| `/assets/bower_components/` | Frontend libraries |

---

## 4. MIME Type Mapping

Logic for determining Content-Type from file extension:

| Extension | Content-Type | Notes |
|---|---|---|
| `.jpg`, `.jpeg` | `image/jpeg` | |
| `.png` | `image/png` | |
| `.eps`, `.svg` | `image/png` | Converted to PNG before serving |
| `.pdf` | `application/pdf` | |
| Other (including no extension) | `text/plain` | Default |

**Extension Detection Rule**: Extract the `.` + alphanumeric suffix at the end of the filename as the extension (case-insensitive). If no match, treat as no extension and return `text/plain`.

---

## 5. Real-Time File Monitoring

### 5.1 Communication Method

Uses bidirectional communication via EventMachine-based Comet (long polling).

- **Configuration**:
  - WebSocket: Disabled
  - Comet: Enabled
  - Timeout: 120 seconds
  - Polling interval: 2 seconds
  - Cross-domain: Not allowed

### 5.2 Client → Server Events

| Event Name | Data | Description |
|---|---|---|
| `open_file` | File path | Sent when a preview window is opened. The server starts monitoring the file |
| `close_file` | File path | Sent when a preview window is closed. The server removes the file from the watch list |

### 5.3 Server → Client Events

| Event Name | Data | Description |
|---|---|---|
| `file_modified` | File path | File has been modified |
| `file_moved` | File path | File has been moved |
| `file_deleted` | File path | File has been deleted |

### 5.4 File Monitoring Behavior

- Uses EventMachine's `watch_file` (leverages OS file monitoring mechanisms; prefers kqueue on macOS)
- On `open_file` received: Add the file to the watch list and start `EM.watch_file`
- On `close_file` received: Remove the file from the watch list
- On `file_deleted`: If the file still exists (e.g., mv + new creation scenario), re-establish `watch_file`
- All events are broadcast to all connected clients

---

## 6. Frontend Specification

### 6.1 Page Structure

The main page consists of:
- Page title "Catscope"
- File list (directory tree)
- Preview windows (dynamically generated on file click)

### 6.2 File List (Directory Tree)

**Initial Display**: On page load, fetch the root directory (`/`) contents via `/api/lsdir/` and render the list.

**Directory Expand/Collapse**:
- Clicking a directory name calls `/api/lsdir/{path}` to fetch and display child elements (expand)
- Clicking again removes child elements (collapse)
- Expand state is managed via the `data-opened` attribute (`"true"` / `"false"`)

**Entry Components**:
- Directory: Folder icon + directory name + refresh button (arrow icon)
- File: File icon + file name + save button (disk icon)

**Refresh Button**: Clicking re-fetches the directory contents and updates the display.

**Save Button**: Links to `/save/{path}`. Clicking downloads the file.

**Minimum Height Preservation**: To prevent layout jumping when collapsing the list, the maximum height during expansion is preserved as `min-height`.

### 6.3 Preview Window

Clicking a file name in the file list generates a preview window.

**Initial Window State**:
- Position: `left: 100px + scrollX`, `top: 100px + scrollY` (offset based on scroll position)
- Size: 600px width × 400px height

**Window Components**:
1. **Title Bar**: Blue (#008CBA) background, height 25px
   - File path display (white text, 15px)
   - Clipboard copy button (Font Awesome: `fa-clipboard`)
   - Close button (Font Awesome: `fa-times-circle`)
2. **Content Area**: Display area for file contents

**Content Display Methods**:

| File Type | Display Method | Detection Criteria |
|---|---|---|
| Images (JPEG, PNG, EPS, SVG) | `<img>` element | Extension matches `/\.(jpe?g\|png\|eps\|svg)/i` |
| Other (text, PDF, etc.) | `<iframe>` element | All others |

- Images use `/preview/{path}?{timestamp}` as `src`
- Other files also use `/preview/{path}?{timestamp}` as the `<iframe>` `src`
- Timestamps are appended for cache busting

**Window Operations**:
- **Drag Move**: Entire window is draggable via jQuery UI's `draggable()`
- **Resize**: Window is resizable via jQuery UI's `resizable()`. Content area height and title bar width are recalculated on resize
- **Focus (z-index management)**: Clicking a window brings it to the front. WindowManager manages z-index for all windows in array order
- **Close**: Clicking the close button removes the window from the DOM and WindowManager. Sends a `close_file` event to the server

**Clipboard Copy Feature**:
- Uses ZeroClipboard (Flash-based)
- Enabled only for text files (extensions: `.txt`, `.tsv`, `.csv`, `.log`)
- On file open, fetches content as text from `/save/{path}` and stores in `copyable_text`
- On successful copy, displays a toast notification via alertify.js

**Real-Time Updates**:
- When `file_modified`, `file_moved`, `file_deleted` events are received from the server, reloads the content of the corresponding preview window
- Reload is performed by appending a new timestamp to the `src` attribute

### 6.4 WindowManager

An object that manages multiple preview windows.

- **Add/Remove Windows**: `add(win)` / `del(win)`
- **Create Windows**: `create(path)` - Creates a PreviewWindow and adds it to management
- **z-index Management**: `set_zindex()` - Assigns z-index in array index order (later = front)
- **Reload by Path**: `reload_by_path(path)` - Reloads all windows matching the specified path

---

## 7. External Tool Dependencies

### 7.1 ImageMagick

Used for PNG conversion of EPS/SVG files.

- `identify`: Get image dimensions (width x height)
- `convert`: Image format conversion (EPS/SVG → PNG)

When ImageMagick is not installed:
- If `identify` is not found, skip image dimension retrieval (return `nil`)
- If `convert` is unavailable, preview generation fails

### 7.2 EPS/SVG Upscaling Logic

To improve visibility of small EPS/SVG images, DPI is automatically adjusted based on pixel count:

1. Threshold: 524,288 px (= 1024×1024÷2)
2. If `width × height < threshold`:
   - `dpi = floor(72 × sqrt(threshold / (width × height)))`
   - Convert with `convert -density {dpi} "{path}" png:-`
3. If at or above threshold:
   - Convert without DPI specification (default 72dpi)

---

## 8. Security Notes

- **No Authentication/Authorization**: No access control mechanisms are implemented. All users who can reach the server can browse and download all files under `TOP_DIR`
- **Default is Localhost Only**: With `--bind 127.0.0.1` (default), access is limited to local connections only
- **Remote Access Warning**: When using `--bind 0.0.0.0`, restricting connections via firewall or iptables is recommended
- **Path Traversal**: Paths are resolved using `File.expand_path`, but validation to restrict access outside `TOP_DIR` is not implemented

---

## 9. UI Styling

### 9.1 CSS Frameworks

- **Foundation** (Zurb): Responsive grid system (`row`, `large-12 columns`)
- **jQuery UI**: Smoothness theme (for window drag/resize)
- **Font Awesome 4.3**: Icon font (close button, copy button)

### 9.2 File List Styles

- Directory: Folder icon (`folder.png`) displayed as background image, 20px left padding
- File: File icon (`page_white.png`) displayed as background image, 20px left padding

### 9.3 Preview Window Styles

- **Window Frame**: `position: absolute`, white background, border color `#b6edff`, drop shadow (`0 0 5px 3px rgba(0,0,0,0.4)`)
- **Title Bar**: Background color `#008CBA` (blue), height `25px`
- **Title Text**: `inline`, font size `15px`, white, left/right padding `10px`
- **Buttons (close/copy)**: `inline`, white, left padding `10px`
- **Content (div)**: `max-width: 100%`, `max-height: 100%`, centered
- **Content (iframe)**: `width: 100%`, `height: 100%`, white background, monospace font (Consolas, Liberation Mono, Menlo, Courier)
- **Content (img)**: `max-height: 100%`

---

## 10. Build and Assets

### 10.1 SCSS Compilation

- Uses Compass to compile SCSS to CSS
- Imports Foundation's SCSS
- Output directory: `assets/stylesheets/`

### 10.2 Build Tasks (Rake)

| Task | Action |
|---|---|
| `rake assets` (default) | Compile SCSS with Compass and copy ZeroClipboard.swf to static/ |
| `rake bower_update` | Update dependency packages with Bower |
| `rake build` | Run `bower_update` → `assets` sequentially |

### 10.3 JavaScript Minification

- Minified with `jsmin` via Asset Pack

---

## 11. Communication Protocol Details (RocketIO / CometIO)

- Library: sinatra-rocketio (Comet mode)
- Client side: Connects via auto-generated script from the `rocketio_js` helper
- Connection establishment: `new RocketIO().connect()`
- Client → Server: `io.push(eventName, data)`
- Server → Client: `Sinatra::RocketIO.push(eventName, data)` broadcasts to all clients
- Server-side event listener: `io.on :eventName do |data, client| ... end`
- Client-side event listener: `io.on("eventName", function(data) { ... })`
