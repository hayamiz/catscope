---
id: "0024"
title: "CLAUDE.md references nonexistent TASK.md"
type: docs
priority: high
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

CLAUDE.md references `TASK.md` in two places:

- Lines 9–11: "Implementation tasks are tracked in TASK.md"
- Line 64: `TASK.md` listed in the project structure tree

The file `TASK.md` does not exist in the repository. This is a dead reference that will confuse users.

## Context

Discovered during gardener audit on 2026-04-18. TASK.md was likely used in an earlier phase of development and has since been removed, but the references in CLAUDE.md were not cleaned up.
