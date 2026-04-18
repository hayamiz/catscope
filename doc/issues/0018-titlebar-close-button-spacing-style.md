---
id: "0018"
title: "Improve title bar close button spacing and appearance"
type: enhancement
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

Two related UX problems with the file window title bar buttons:

### 1. Insufficient spacing between action buttons and the close button

The copy button, pretty-print toggle button, and the close button are all packed tightly together in the title bar. This makes it easy to accidentally click the close button when intending to click copy or toggle. There should be approximately one button-width of margin separating the close button from the other action buttons.

### 2. Close button is too small and has an unclear clickable area

The current per-window close button (`closeBtn` in `app.js:265-268`) uses a bare `.btn` class with a small SVG icon (`close.svg`). The clickable area is not visually obvious, making it hard to target. In contrast, the workspace-level "Close All" button introduced in #0004 uses the `.header-btn` class, which has a clearer visual style with defined padding, border-radius, and hover effects.

The per-window close button should adopt the same visual style as the `.header-btn` class used by the workspace-level buttons, so that all close-related buttons in the application have a consistent, clearly clickable appearance.

## Context

The title bar buttons are constructed in `frontend/js/app.js` around lines 230-273 in `PreviewWindow.prototype.init`. The close button is appended last in the title bar:

```js
var closeBtn = document.createElement("button");
closeBtn.className = "btn";
closeBtn.title = "Close";
closeBtn.innerHTML = '<img src="/assets/icons/close.svg" alt="Close">';
```

The `.header-btn` style (defined in `frontend/css/style.css:125-143`) provides consistent padding, border-radius, opacity transitions, and hover effects — the same treatment should be applied to the per-window close button.

### Changes needed

1. **CSS**: Add a margin-left (approximately one button-width, e.g., `margin-left: 8px` or similar) to the close button in the title bar to visually separate it from adjacent action buttons.
2. **CSS/JS**: Update the close button's class or styling to match the `.header-btn` appearance (padding, border-radius, hover effect), or create a shared style that both can use.
3. **Files affected**:
   - `frontend/js/app.js` — close button class/style in `PreviewWindow.prototype.init`
   - `frontend/css/style.css` — title bar button styles

## Triage

- **Complexity**: low
- **Mechanical fix**: yes (partially)
- **Requires user decision**: yes (minor)
- **Analysis**: All title bar buttons (copy, render-toggle, close) use class `btn` with 20x20px size and 4px left margin. The spacing fix (increase `margin-left` on the close button) is mechanical. However, the issue also proposes matching `.header-btn` styling, which raises a minor design question: should the close button be made larger (e.g., 25x25px) for prominence, or keep 20px with better visual styling? The CSS/JS changes are small — add a specific class to the close button in `app.js:266` and add corresponding CSS rules for spacing and hover effects.
- **Triaged on**: 2026-04-18

## Resolution

