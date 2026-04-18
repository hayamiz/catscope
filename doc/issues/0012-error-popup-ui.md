---
id: "0012"
title: "Add error popup UI for displaying backend errors to users"
type: feature
priority: medium
status: open
created: 2026-04-17
updated: 2026-04-18
---

## Description

Add a UI component for displaying error messages to users as popup notifications. This is needed for surfacing backend errors (e.g., S3 API errors like 403 Forbidden, 404 Not Found, throttling) in a user-friendly way, but should be generic enough to handle any error type.

### Requirements

- Display error messages as a temporary popup/toast notification.
- Errors should be dismissible (click to close or auto-dismiss after timeout).
- Support different severity levels (error, warning, info) if needed.
- Must not block interaction with the rest of the UI.
- Should be visually distinct and noticeable without being intrusive.

## Context

Created from #0006 (S3 backend support) — the S3 backend needs a way to present API errors to users. Rather than designing error presentation within the S3 issue, this is tracked separately as a reusable UI component that can serve any error source.

## Implementation Notes

### Current State of Error Handling

The codebase already has a simple `showToast(message)` function in `app.js` (line 41) that displays a single-severity (success-only, green `#5cb85c`) toast at bottom-right with a fixed 2.5s auto-dismiss and fade-out animation. It is used only for clipboard copy confirmation.

Error handling is currently ad-hoc and inconsistent:
- **EPS preview failure**: Inline error message inside the preview window content area (not a toast).
- **File deletion**: Inline "File has been deleted" message in the preview window.
- **Directory listing API errors**: Silently swallowed (`if (!r.ok) return []` in `loadDirectory`).
- **WebSocket errors/disconnects**: Silent auto-reconnect with no user-visible feedback.

There is no generic mechanism for surfacing errors, warnings, or informational messages to the user.

### Proposed Approach: Extend Existing `showToast()`

Rather than building a new component from scratch, extend the existing `showToast()` function to support severity levels and dismissal. This minimizes code churn while delivering all required functionality.

**API change**: `showToast(message)` becomes `showToast(message, options)` where `options` is an optional object with:
- `severity`: `"success"` (default, current behavior), `"error"`, `"warning"`, `"info"`
- `duration`: auto-dismiss timeout in ms (default varies by severity)
- `dismissible`: whether to show a close button (default: `true` for errors, `false` for success/info)

Existing call sites (`showToast("Copied to clipboard")`) remain unchanged since the second argument is optional.

### Design Decisions Needed (Requires User Input)

The following choices affect UX and visual design and cannot be resolved mechanically:

#### 1. Severity Color Scheme

| Severity | Proposed Color | Rationale |
|----------|---------------|-----------|
| success  | `#5cb85c` (current green) | Already in use |
| error    | `#d9534f` (red) | Matches `#login-error` color in existing CSS |
| warning  | `#f0ad4e` (amber) | Standard warning color |
| info     | `#5bc0de` (light blue) | Neutral informational tone |

**Decision**: Are these colors acceptable, or should they match the `#008CBA` brand blue?

#### 2. Auto-Dismiss Duration by Severity

| Severity | Proposed Duration | Rationale |
|----------|------------------|-----------|
| success  | 3s (current ~2.5s, round up) | Brief confirmation |
| info     | 4s | Slightly longer for reading |
| warning  | 6s | User should notice |
| error    | No auto-dismiss (manual close only) | Errors should not vanish unread |

**Decision**: Should errors auto-dismiss (e.g., after 10s), or require manual dismissal? Manual dismissal is safer but could accumulate if many errors fire.

#### 3. Toast Stacking and Maximum Count

When multiple toasts appear simultaneously (e.g., rapid S3 errors during a network issue), they need to stack.

**Options**:
- **(A) Stack vertically upward** from bottom-right, newest on bottom. Simple, standard pattern.
- **(B) Stack vertically upward**, newest on top. Less conventional but keeps latest error most visible.
- **(C) Replace** previous toast of same severity. Prevents accumulation but loses history.

**Decision**: Which stacking behavior? Also, should there be a maximum visible count (e.g., 5 toasts, oldest removed when limit exceeded)?

#### 4. Toast Position

Current toast is at `bottom: 20px; right: 20px`. This could overlap with preview windows.

**Options**:
- **(A) Keep bottom-right** (current position). Standard convention.
- **(B) Top-right**. More visible, less overlap with content area.
- **(C) Top-center**. Most prominent, but can feel intrusive.

**Decision**: Keep bottom-right or move?

#### 5. Which Existing Errors to Migrate

Once the toast system is in place, which silent failures should start showing toasts?

| Error Source | Current Behavior | Proposed |
|---|---|---|
| Directory listing API failure | Silent (returns empty) | Show error toast |
| WebSocket disconnect | Silent reconnect | Show warning toast on disconnect, info toast on reconnect |
| EPS preview 501 | Inline in preview window | Keep inline (contextual, not a toast) |
| File deleted | Inline in preview window | Keep inline (contextual, not a toast) |
| Fetch failures (network errors) | Unhandled | Show error toast |

**Decision**: Which of these should be migrated to the new toast system?

## Triage

- **Complexity**: medium
- **Mechanical fix**: no
- **Requires user decision**: yes
- **Analysis**: The implementation itself is straightforward -- extend the existing `showToast()` function in `app.js` with severity support, add CSS classes for each severity level, and add an optional close button. The CSS additions are modest (~30-40 lines for severity colors, close button, and stacking). The JS changes are moderate (~40-60 lines to refactor `showToast`, add stacking logic, and a toast container element). However, five design decisions remain unresolved (severity colors, auto-dismiss duration, stacking behavior, position, and which errors to migrate). These are UX/visual choices that require user input before implementation can proceed. No changes are needed to the Go backend -- this is purely a frontend feature. SPEC.md section 7.7 (Toast Notifications) and section 9.2 (Color Palette) will need to be updated once design decisions are made.
- **Triaged on**: 2026-04-18

## Resolution

