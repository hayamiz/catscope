---
id: "0026"
title: "README.md missing --quiet/-q flag in options table"
type: docs
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

The `--quiet` / `-q` flag is implemented in `main.go:35` and documented in SPEC.md, but is not listed in the README.md options table. Users reading the README will not know about this option.

## Context

Discovered during gardener audit on 2026-04-18. The flag suppresses the startup banner and was added after the README options table was last updated.
