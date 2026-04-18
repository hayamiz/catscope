---
id: "0007"
title: "Add grid-snap for window positioning and resizing"
type: feature
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

Currently, window move and resize operations are free-form — windows can be placed at any pixel position and sized to any dimension. This makes it difficult to align windows neatly side by side or to match their sizes.

Add a **grid-snap** feature that quantizes window position and size to a fixed grid interval during drag and resize operations.

### Behavior

- **Position snapping**: When dragging a window, its top-left corner snaps to the nearest grid point.
- **Size snapping**: When resizing a window, its width and height snap to the nearest grid multiple.
- **Grid size**: Start with ~50px as the grid interval. The exact value should be tuned based on usability testing — it must feel responsive without being too coarse.
- **Default state**: Grid-snap is **ON** by default.
- **Toggle**: Provide a way to toggle grid-snap on/off. Options include:
  - A toggle button/icon in the header or workspace menu (see #0004).
  - Holding a modifier key (e.g., Alt) to temporarily disable snapping during a drag/resize operation.
  - Both approaches could be combined.

### Implementation notes

- Snapping should be applied in the Pointer Events handlers for drag and resize in `frontend/js/app.js`.
- The snap calculation is: `snapped = Math.round(value / gridSize) * gridSize`.
- The grid-snap state (on/off) can be stored in a global variable or a UI state object.
- Consider showing a subtle visual grid overlay when snapping is active (optional, low priority).

## Context

This improves the window management experience, especially when working with multiple file previews. Being able to quickly tile windows into neat rows and columns without pixel-perfect manual alignment is a significant usability improvement. This complements #0004 (workspace window management menu) — grid-snap helps with manual arrangement, while the tile feature in #0004 handles automatic arrangement.

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All design decisions are already resolved in the Resolution section. The implementation touches three files with well-isolated changes:
  1. **`frontend/js/app.js`**: Add a `GRID_SIZE` constant (50) and a `gridSnapEnabled` flag (default `true`). Add a `snap(value)` helper that applies `Math.round(value / GRID_SIZE) * GRID_SIZE` when enabled. In `setupDrag` (line ~406), wrap the computed left/top values with `snap()`. In `setupResize` (line ~432), wrap the computed width/height with `snap()` before applying `Math.max` minimum constraints. Add a DOMContentLoaded handler to wire up the header toggle button and update the grid overlay class on `#main`.
  2. **`frontend/index.html`**: Add a grid-snap toggle button in `#header` (between the version span and the optional logout button). Follow the existing `#logout-btn` styling pattern.
  3. **`frontend/css/style.css`**: Add styles for the toggle button in the header. Add a grid overlay on `#main` using CSS `background-image` with `repeating-linear-gradient` (both horizontal and vertical lines at `GRID_SIZE` intervals), toggled via a `.grid-active` class.
  No ambiguity remains; all decisions (grid size, toggle UX, default state, overlay) are documented. The snap math is a two-line wrapper around existing pointer-event handlers. The toggle button follows the existing header button pattern (`#logout-btn`). The grid overlay is pure CSS. Estimated effort: ~1 hour.
- **Triaged on**: 2026-04-18

## Resolution

Added `GRID_SIZE` constant (50px) and `snap()` helper in `app.js`. Wrapped drag position and resize dimension calculations with `snap()`. Added header toggle button (`#grid-snap-btn`) with `.header-btn` styling consistent with future #0004 buttons. Grid overlay uses CSS `repeating-linear-gradient` on `#main.grid-active`. Default is ON. Parameterized via `GRID_SIZE` constant for easy adjustment.