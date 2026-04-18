---
id: "0004"
title: "Add workspace-level window management menu in header"
type: feature
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

Add a workspace-level menu to the `div#header` area that provides bulk operations on all open file windows. The initial set of features should include:

1. **Close all windows** — Close every open file window at once.
2. **Tile windows** — Automatically arrange all open windows in a tiled layout that fills the available viewport area (grid-based).

### Additional features to consider

The following are candidates for inclusion in the menu (to be discussed and prioritized):

- **Cascade windows** — Arrange windows in a cascading (stacked, offset) layout.
- **Minimize all / Restore all** — Collapse all windows to a minimal state and restore them.
- **List open windows** — Show a list of currently open windows for quick navigation (click to bring to front).
- **Save / Restore layout** — Persist the current window arrangement and restore it later.
- **Stack windows** — Arrange all windows into a single tabbed stack.

## Context

Currently there is no way to perform bulk operations on open windows. When many file windows are open, users must close or rearrange them one by one, which is tedious. A workspace menu in the header provides a natural, discoverable location for these global actions.

### Design considerations

- The menu should be placed in the existing `div#header` element, visually consistent with the current header style.
- Menu items should be clearly labeled with icons or text.
- Tile layout algorithm should handle varying numbers of windows gracefully (e.g., 1 window = full area, 2 = side-by-side, 3+ = grid).
- The exact set of menu items beyond "Close all" and "Tile" is TBD — start with these two and expand based on user feedback.

## Implementation Notes

### "Close All" — mechanical, straightforward
Loop through `WindowManager.windows[]` and call `close()` on each.

### "Tile Windows" — requires algorithm choice

**Option A (Recommended): Balanced Grid**
- `rows = ceil(sqrt(n))`, `cols = ceil(n / rows)`
- Each window sized to `viewportWidth / cols` × `viewportHeight / rows`
- Simple, predictable, scales to any N

**Option B: Row-by-row packing**
- Fit windows per row based on min-width constraint, more efficient but complex

### Resolved decision points

1. **Tiling algorithm** — balanced grid (`rows = ceil(sqrt(n))`, `cols = ceil(n / rows)`)
2. **MVP scope** — close all + tile only
3. **Menu UI** — icon only, hover shows operation description tooltip
4. **Resize on tile** — yes, windows are resized to fit grid cells

## Triage

- **Complexity**: medium
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All design decisions are resolved. The implementation breaks down into four well-defined tasks:
  1. **Add two icon buttons to `div#header`** in `frontend/index.html`. The header is already a flex row (`display: flex; align-items: center`). Buttons should be inserted after the version span and before the logout button (which uses `margin-left: auto` to right-align). New SVG icon files (or inline SVGs) are needed for "close all" and "tile" actions. Style them consistently with the existing `.btn` pattern used in title bars.
  2. **Implement `WindowManager.closeAll()`** in `frontend/js/app.js`. Iterate `WindowManager.windows[]` in reverse (since `close()` calls `remove()` which splices the array) and call `close()` on each. The existing `close()` method already handles unwatch, DOM removal, and array cleanup.
  3. **Implement `WindowManager.tileWindows()`** in `frontend/js/app.js`. Algorithm: `rows = Math.ceil(Math.sqrt(n))`, `cols = Math.ceil(n / rows)`. Compute cell size from `document.getElementById("main")` dimensions (offsetWidth / offsetHeight). Set each window's `style.left`, `style.top`, `style.width`, `style.height` accordingly. Handle edge case of 0 windows (no-op).
  4. **Add header button styles** to `frontend/css/style.css`. Keep consistent with existing color palette (white icons on #008CBA background, hover effect).
  No spec changes are needed beyond adding the buttons to the Section 7.2 page structure description and a new subsection for workspace operations. Estimated effort: small-to-medium, all patterns exist in the codebase.
- **Triaged on**: 2026-04-18

## Resolution

Added `closeAll()` and `tileWindows()` methods to WindowManager in `app.js`. `tileWindows` uses balanced grid algorithm: `rows = ceil(sqrt(n))`, `cols = ceil(n / rows)`, sizing windows to fill `#main`. Added two header buttons (`#tile-btn`, `#close-all-btn`) using the `.header-btn` style class (consistent with #0007 grid-snap button). Wired click handlers in DOMContentLoaded.
