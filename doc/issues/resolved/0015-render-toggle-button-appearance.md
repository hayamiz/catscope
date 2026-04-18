---
id: "0015"
title: "Render toggle button is hard to read and wraps across lines"
type: enhancement
priority: medium
status: resolved
created: 2026-04-18
updated: 2026-04-18
---

## Description

The render toggle button in the preview window title bar currently displays `{ }` as its label. This has two problems:

1. **Hard to understand** — The `{ }` text does not clearly communicate "toggle between raw and pretty-printed view" to users unfamiliar with the convention.
2. **Line wrapping** — The button is narrow, and the text wraps between `{` and `}`, resulting in a broken two-line layout.

Relevant code: `frontend/js/app.js:254` sets `textContent = "{ }"`, styled in `frontend/css/style.css:287` at 11px monospace font.

## Context

Introduced in #0003 (raw/pretty toggle switch). The button sits in the `.preview-titlebar` alongside copy and close buttons, which use SVG icons. The `{ }` text button is visually inconsistent with its icon-based neighbors.

## Design Candidates

The following options should be considered. Each has trade-offs in clarity, visual consistency, and implementation effort.

### Option A: SVG icon — `</>` code brackets

Use a custom SVG icon depicting `</>` (the widely-recognized "code/source" symbol). The active state could show a document/eye icon, or the same icon with a highlight.

- **Pros**: Universally recognized as "source code"; consistent with the existing icon-based buttons; no wrapping issues.
- **Cons**: Requires creating or sourcing a new SVG asset.

### Option B: SVG icon — eye / eye-off

Use an eye icon (pretty/rendered view) that changes to eye-with-slash (raw view) on toggle, or vice versa.

- **Pros**: Intuitive "view" metaphor; clearly communicates state change.
- **Cons**: Two SVG states needed; "eye" may be confused with visibility rather than formatting.

### Option C: Text label — "Raw" / "Pretty"

Replace the symbolic text with explicit labels. Show "Pretty" when in raw mode (click to switch to pretty), or "Raw" when in pretty mode.

- **Pros**: Most explicit; no ambiguity about what clicking does.
- **Cons**: Takes more horizontal space; English-specific.

### Option D: Unicode icon — single-character symbol

Use a single Unicode character that won't wrap, such as `✦` (pretty) / plain text indicator, or `⟨⟩` as a single non-breaking unit.

- **Pros**: Minimal change; no new assets needed; no wrapping.
- **Cons**: Meaning may still be unclear; font rendering varies across platforms.

### Option E: Two-state icon button with tooltip

Use a pair of icons (e.g., Option A or B) where the icon changes depending on the current state, combined with an informative tooltip (`title` attribute) like "Switch to pretty view" / "Switch to raw view".

- **Pros**: Combines visual clarity with discoverability; tooltip eliminates ambiguity.
- **Cons**: Requires two SVG assets and state-dependent rendering.

## Recommendation

Options A or E provide the best balance of clarity and visual consistency with the existing UI. The final choice is left to the user.

## Triage

- **Complexity**: low
- **Mechanical fix**: yes (user chose Option A)
- **Requires user decision**: no (resolved — Option A selected)
- **Analysis**: The `{ }` text button wraps because `.render-toggle` lacks `white-space: nowrap` and is constrained to 20px width. User selected Option A: replace with an SVG `</>` code brackets icon, consistent with the existing icon-based copy and close buttons. Implementation: create a `</>` SVG icon, replace `textContent = "{ }"` with SVG innerHTML in `app.js:254`, and adjust CSS in `style.css:287`.
- **Triaged on**: 2026-04-18

## Resolution

Implemented Option A: replaced the `{ }` text label with a custom `</>` SVG code brackets icon.

Changes made:
- Created `frontend/icons/code.svg` -- a 16x16 SVG depicting `</>` code brackets, matching the style of existing icons (clipboard.svg, close.svg).
- Updated `frontend/js/app.js` -- replaced `textContent = "{ }"` with an `<img>` element referencing `/assets/icons/code.svg`, following the same pattern as copy and close buttons. Added `title="Toggle pretty-print"` tooltip.
- Updated `frontend/css/style.css` -- removed monospace font properties from `.render-toggle` (no longer needed for icon), switched to opacity-based styling consistent with other icon buttons.
- Updated `e2e/tests/render-toggle.spec.ts` -- added test verifying the toggle button contains an `<img>` element (not text) with the correct SVG source.

Verified: `go vet .` and `go test .` pass. Build succeeds with the new SVG embedded.
