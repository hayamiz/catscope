---
id: "0023"
title: "CLAUDE.md project structure missing source files"
type: docs
priority: high
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

The project structure tree in CLAUDE.md is missing several source files that exist in the repository:

- `auth.go` — Authentication (password protection)
- `render.go` — HTML rendering, markdown, syntax highlighting
- `mimetype.go` — MIME type detection
- `updater.go` — Self-update mechanism

Also missing from the frontend section:

- `frontend/login.html` — Login page for authentication
- `frontend/fonts/` — Web fonts directory (FiraCode, UbuntuMono, VictorMono)

## Context

Discovered during gardener audit on 2026-04-18. The project structure tree in CLAUDE.md lines 40–66 was written before these modules were added. Developers reading CLAUDE.md will get an incomplete picture of the codebase.
