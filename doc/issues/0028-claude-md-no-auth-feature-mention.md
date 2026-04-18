---
id: "0028"
title: "CLAUDE.md does not mention authentication feature"
type: docs
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

Authentication is a significant feature implemented in `auth.go` and documented extensively in SPEC.md (Section 4.2), but CLAUDE.md makes no mention of it. The Key Design Decisions section covers path security, SVG/EPS handling, WebSocket, and frontend constraints — but not authentication.

Developers reading CLAUDE.md will not know authentication exists or how it works.

## Context

Discovered during gardener audit on 2026-04-18. Authentication was added after the initial CLAUDE.md was written.
