---
id: "0016"
title: "Remove duplicate JSON pretty-print checkbox in favor of unified render toggle"
type: enhancement
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

The JSON file preview currently has two overlapping pretty-print controls:

1. **Old**: A JSON-specific "pretty-print" checkbox that existed before #0003.
2. **New**: The unified raw/pretty toggle button introduced in #0003, which handles JSON pretty-printing (among other file types) via the `/render/` endpoint.

These two controls are redundant and potentially confusing to users. The unified toggle button from #0003 should be the sole mechanism for switching between raw and pretty-printed views. The legacy JSON-specific pretty-print checkbox should be removed.

## Context

Issue #0003 introduced a server-side `/render/` endpoint and a toggle button in the file window title bar that supports pretty-printing for JSON, Markdown, YAML, and syntax highlighting for source code. The older JSON-specific checkbox predates this unified approach and is now superseded. Having both controls creates UI clutter and may lead to conflicting states (e.g., checkbox enabled but toggle set to raw, or vice versa).

Affected areas:
- **Frontend**: `frontend/js/app.js` — checkbox creation/event handling logic for JSON pretty-print
- **Frontend**: `frontend/css/style.css` — any styles specific to the old checkbox
- **Spec**: `doc/SPEC.md` — may reference the old checkbox behavior

## Triage

- **Complexity**: low
- **Mechanical fix**: no (issue is invalid)
- **Requires user decision**: yes
- **Analysis**: Investigation found no duplicate JSON-specific pretty-print checkbox in the current codebase. The unified render toggle from #0003 is already the sole mechanism for switching between raw and pretty views. No `<input type="checkbox">` or checkbox-related code exists in `app.js` for JSON pretty-printing. The "old" checkbox referenced in the issue does not exist — it was either never implemented, already removed, or described speculatively. This issue should be closed as wontfix/invalid, or the reporter should clarify what duplicate control they observed.
- **Triaged on**: 2026-04-18

## Resolution
