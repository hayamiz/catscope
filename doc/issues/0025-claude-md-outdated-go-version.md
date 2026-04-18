---
id: "0025"
title: "CLAUDE.md states Go 1.22+ but go.mod requires 1.25.0"
type: docs
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

CLAUDE.md line 30 states the tech stack uses "Go 1.22+" but `go.mod` specifies `go 1.25.0`. The documented minimum version is outdated and misleading.

## Context

Discovered during gardener audit on 2026-04-18. The Go version was likely bumped in go.mod without updating CLAUDE.md.
