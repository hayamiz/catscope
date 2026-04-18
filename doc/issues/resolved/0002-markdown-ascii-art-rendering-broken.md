---
id: "0002"
title: "ASCII art in Markdown files renders with broken alignment"
type: bug
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

When previewing Markdown files (`.md`) that contain ASCII art — such as box-drawing characters and tree diagrams — the visual alignment is broken. Spaces and box-drawing characters do not align correctly because HTML collapses consecutive whitespace by default.

For example, a diagram like:

```
┌─────────────┐
│  main.cpp   │
└──────┬──────┘
       │
       ├──> ComponentA
       └──> ComponentB
```

renders with misaligned characters, making the diagram unreadable.

## Context

The root cause is that in standard HTML rendering, multiple consecutive space characters are collapsed into a single space. ASCII art and code blocks rely on every space being preserved and rendered at a fixed width.

The fix should ensure that:

1. **Monospace font** is used for text preview of Markdown and plain-text files.
2. **Code blocks** (fenced with triple backticks) and indented blocks preserve whitespace faithfully — using a `<pre>` or CSS `white-space: pre` approach.
3. Inline code spans also use monospace and preserve spacing.

This is related to #0001 (text preview whitespace broken) but specifically concerns Markdown rendering where ASCII art inside code fences must retain exact character alignment.

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: Markdown files (`.md`) are served by the Go backend as `text/plain; charset=utf-8` (see SPEC Section 5) and displayed in an `<iframe>` via the same code path as all other text files (`app.js` lines 232-234, the `else` branch in `loadContent`). There is no separate Markdown-to-HTML rendering — no client-side Markdown parser, no server-side conversion. The `/preview/` handler in `server.go` serves `.md` files with `text/plain` MIME type, and the browser renders `text/plain` iframe content inside a native `<pre>` element with monospace font and preserved whitespace by default. This means #0002 is a strict duplicate of #0001 — both issues share the identical rendering pipeline. Any fix applied to text file whitespace handling in #0001 will automatically resolve this issue as well. No separate fix is needed.
- **Triaged on**: 2026-04-18

## Resolution

Resolved during font adjustment work, same as #0001. Closed per user confirmation.
