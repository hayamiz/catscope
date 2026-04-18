---
id: "0006"
title: "Support S3 buckets as a browsable backend via --directory"
type: feature
priority: low
status: open
created: 2026-04-17
updated: 2026-04-18
---

## Description

Allow the `--directory` option to accept an S3 URI (`s3://<bucket>/path/to/dir`), enabling catscope to browse and preview files stored in S3 buckets.

### Architecture

Introduce a **storage backend abstraction** with two implementations:

1. **Filesystem backend** (existing) — serves files from the local filesystem using `os` and `filepath`. This is the current behavior.
2. **S3 backend** (new) — serves files from an S3 bucket using the AWS SDK for Go.

The backend is selected based on the `--directory` argument:
- Starts with `s3://` → S3 backend
- Otherwise → filesystem backend

The backend interface should provide operations needed by the existing handlers: list directory, read file, stat file, etc.

### File change notifications

- **Investigation needed**: Determine whether S3 provides an event-based mechanism (e.g., S3 Event Notifications via SQS/SNS, or S3 EventBridge) that could be used for real-time change detection from catscope.
- **Likely outcome**: S3 event APIs require additional AWS infrastructure (SQS queues, EventBridge rules) and are not practical to set up transparently from a CLI tool. Polling is possible but adds cost and latency.
- **Pragmatic approach**: Since S3 files are updated infrequently, implement a **manual reload button** in the UI instead of automatic live reload. The WebSocket-based file watcher would be disabled for S3-backed directories.

### Authentication scope (initial)

For the initial implementation, do **not** implement explicit credential configuration. Rely on:
- **IAM roles** (e.g., EC2 instance role, ECS task role) — the standard AWS SDK credential chain.
- **Environment variables** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) — already supported by the SDK default credential provider.
- **Public buckets** — no credentials needed.

Explicit credential options (profiles, assume-role, etc.) can be added later if needed.

### Key implementation details

- Add `github.com/aws/aws-sdk-go-v2` as a dependency.
- The S3 backend should map S3 object key prefixes to directory listings (S3 has no real directories, only key prefixes with `/` delimiters).
- File download and preview should stream S3 objects via `GetObject`.
- Path security validation must be adapted for S3 keys (no `..` traversal, prefix must stay within the specified path).

## Context

Catscope is currently limited to local filesystems. Supporting S3 would make it useful for browsing data and artifacts stored in cloud storage — a common scenario in data science and ML pipelines where results, logs, or datasets are written to S3.

This is a significant feature that introduces a new dependency (AWS SDK) and a backend abstraction layer. It should be implemented after the core local-filesystem features are stable.

## Implementation Notes

### Phase 1: Backend Abstraction
Define a `Backend` interface (`Stat`, `ReadFile`, `ReadDir`, `Join`, `Base`, `Ext`). Create `FilesystemBackend` wrapping existing code. Refactor handlers to accept backend instead of bare `topDir`.

### Phase 2: S3 Backend
Add AWS SDK v2. Implement `S3Backend`: parse `s3://bucket/prefix`, use `ListObjectsV2` for directory listing, `GetObject` for file streaming, `HeadObject` for stat. Adapt path security for S3 key prefixes.

### Phase 3: File Watching
Disable `fsnotify` watcher for S3. Add manual reload button in frontend UI. Document limitations in SPEC.

### Resolved decision points

1. **MVP scope** — read-only with no live updates
2. **Credentials** — default AWS SDK chain + optional `--aws-profile` flag
3. **UI indicator** — header shows `[S3 icon] [mounting path]` next to version string
4. **Error presentation** — deferred to a separate error popup UI issue
5. **Priority** — low, not urgent

### Caching strategy analysis

Evaluated four approaches for S3 directory listing caching:

| Approach | Complexity | API Cost | Latency | Staleness |
|---|---|---|---|---|
| No cache | Trivial | Highest | 50-200ms per click | Never |
| TTL cache (30s-5min) | Low-medium | Moderate | Fast within TTL | Implicit, unpredictable |
| Cache until reload | Low | Lowest | Fast after first load | Explicit, user-controlled |
| Hybrid (TTL + reload) | Medium | Low-moderate | Fast | Brief, mitigated |

**Recommendation: Cache until manual reload.**

Rationale:
- Natural fit — no-live-updates design already requires a reload button, which doubles as cache invalidation
- Simplest implementation (~30 lines: `sync.Map` keyed by prefix, `Clear()` on reload)
- Best UX — instant navigation after first load, staleness is explicit and user-controlled
- Lowest API cost — each prefix fetched exactly once per reload cycle
- Memory is not a concern — prefix-delimited listings are small even for large buckets
- Reload clears entire cache (not just current prefix) for a simple mental model

## Triage

- **Complexity**: high
- **Mechanical fix**: no
- **Requires user decision**: no
- **Analysis**:

  All design decisions are resolved, but this is not a mechanical fix — it is a large-scale architectural refactor plus new feature implementation. The scope touches nearly every production source file.

  **Code-level impact assessment (from source review):**

  1. **`main.go`** — The `--directory` flag value goes through `filepath.Abs`, `filepath.EvalSymlinks`, and `os.Stat`, all of which are filesystem-specific. An `s3://` URI would need to be detected before this path and routed to an S3-specific initialization flow. A new `--aws-profile` flag must be added.

  2. **`server.go`** — All six data-serving handlers (`handleFile`, `handlePreview`, `handleSave`, `handleLsdir`, `handleWebSocket`, `handleAssets`) take `topDir string` and use `os.Stat`, `os.ReadDir`, `filepath.Join`, `http.ServeFile` directly. Each must be refactored to call through a `Backend` interface instead. `handlePreview` also calls `convertEPSToPNG` which reads from the local filesystem — EPS conversion would need to be disabled or adapted for S3.

  3. **`watcher.go`** — `newWatcherHub()` creates an `fsnotify.Watcher` and panics on failure. For S3, a no-op watcher hub (or a nil-safe path) is needed. The `handleWebSocket` handler must gracefully handle the absence of file watching — either by ignoring watch/unwatch messages or by not opening the WebSocket endpoint at all.

  4. **`pathutil.go`** — `resolvePath()` uses `filepath.Join` + `filepath.EvalSymlinks` for path security. S3 key-prefix validation needs an entirely different approach (no symlinks, no `..` traversal, prefix containment check on string keys).

  5. **`go.mod`** — Currently only 2 external deps. Adding `aws-sdk-go-v2` brings in ~10+ transitive modules (core, config, credentials, service/s3, etc.), significantly increasing the dependency footprint.

  6. **Frontend (`app.js`, `index.html`, `style.css`)** — Needs a manual reload button (S3 has no live file events), a header indicator showing `[S3 icon] [mounting path]`, and conditional disabling of WebSocket reconnect logic when in S3 mode.

  **Estimated work items:**
  - Define `Backend` interface (~6 methods: Stat, ReadDir, Open, Join, Base, Ext)
  - Implement `FilesystemBackend` wrapping existing `os`/`filepath` calls
  - Implement `S3Backend` (ListObjectsV2, GetObject, HeadObject, key-prefix security)
  - Implement cache-until-reload (sync.Map keyed by prefix, Clear on reload)
  - Refactor all handlers to accept `Backend` instead of `topDir string`
  - Create no-op watcher hub for S3 mode
  - Add `--aws-profile` CLI flag and S3 URI detection in `main.go`
  - Frontend: reload button, header indicator, conditional WebSocket behavior
  - Tests for S3Backend (likely with mocked S3 client), updated handler tests
  - Update SPEC.md with S3 backend documentation

  **Verdict**: Implementation is unambiguous (all design points resolved) but large — estimated 10+ files changed, 1000+ lines of new code, and a major new dependency. Priority is low; defer until core local-filesystem features are fully stable and tested.

- **Triaged on**: 2026-04-18

## Resolution

- read-only with no live updates でOK
- cache S3 directory listings? For how long? については caching strategy とそのメリット・デメリットをより深く検討してください
- credential は `--aws-profile` で指定可能(optional)。指定が無い場合には role を assume するか、 public なバケットをassumeする
- error presentation は、エラーをポップアップ表示するUIを検討するissueを新たに作成してそちらで検討する
- UI indicator: ヘッダの Catscope vX.Y.Z の横に、 [icon: S3 or File] [text: mouting path] の形式で表示する
- Priority は low でまだ実装を急がない。

