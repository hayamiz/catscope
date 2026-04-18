---
id: "0017"
title: "Markdown tables not rendered in pretty-print mode due to missing GFM extension"
type: bug
priority: high
status: resolved
created: 2026-04-18
updated: 2026-04-18
---

## Description

When viewing a Markdown file in pretty-print mode (via the `/render/` endpoint), pipe-delimited tables are not rendered as HTML `<table>` elements. Instead, they appear as broken plain text. The same Markdown renders correctly in VSCode and other GFM-compatible editors.

**Reproduction steps:**
1. Open `examples/text/sample.md` in catscope.
2. Toggle pretty-print mode on.
3. Observe the "Components" table near the top — it is displayed as garbled text rather than a proper table.

**Expected:** The table is rendered as a proper HTML table with headers and rows.

**Actual:** The table markup is output as plain text with pipes and dashes visible.

## Context

The root cause is in `render.go:25`:

```go
md := goldmark.New()
```

`goldmark.New()` creates a Markdown parser with only the CommonMark spec. GFM (GitHub Flavored Markdown) tables are **not** part of CommonMark — they require the GFM extension. The goldmark library supports this via the `github.com/yuin/goldmark/extension` package, but the extension is not currently enabled.

The fix is to configure goldmark with GFM extensions. The goldmark library provides a built-in `extension.Table` (for tables only) or `extension.GFM` (for full GFM support including tables, strikethrough, autolinks, and task lists). Given that Markdown in the wild overwhelmingly uses GFM conventions, enabling full GFM support is recommended.

### Required change

```go
import "github.com/yuin/goldmark/extension"

md := goldmark.New(
    goldmark.WithExtensions(extension.GFM),
)
```

The `extension` package is part of the goldmark module already in `go.mod` — no new dependency is needed.

### Files affected

- `render.go` — goldmark initialization (line 25)
- `doc/SPEC.md` — should document that GFM is the supported Markdown dialect

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: Confirmed: `render.go:25` initializes goldmark without extensions (`goldmark.New()`). The fix is a 3-line change: import `github.com/yuin/goldmark/extension` and add `goldmark.WithExtensions(extension.GFM)`. The `extension` package is part of the goldmark module already in `go.mod` (v1.8.2 indirect) — no new dependency needed. The `wrapHTML()` function already includes table styling (lines 141-143), suggesting GFM support was intended. `examples/text/sample.md` contains a pipe table (lines 7-12) that can be used to verify the fix. Enabling full GFM adds tables, strikethrough, autolinks, and task lists with no breaking changes.
- **Triaged on**: 2026-04-18

## Resolution

Fixed by enabling GFM (GitHub Flavored Markdown) extensions in the goldmark Markdown renderer. Changed `goldmark.New()` to `goldmark.New(goldmark.WithExtensions(extension.GFM))` in `render.go`. This enables tables, strikethrough, autolinks, and task lists. Added table-driven regression tests in `render_test.go` covering pipe tables, strikethrough, autolinks, and task lists. Updated `doc/SPEC.md` to document GFM as the supported Markdown dialect. No new dependencies were needed -- the `extension` package is part of the existing goldmark module.
