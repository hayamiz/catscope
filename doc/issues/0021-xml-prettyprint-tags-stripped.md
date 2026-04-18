---
id: "0021"
title: "XML file preview renders only inner text, tags are stripped"
type: bug
priority: high
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

When viewing an XML file (e.g., `examples/text/sample.xml`) in the default raw preview (pretty-print OFF), only the text content is displayed — all XML tags (`<rss>`, `<channel>`, `<item>`, etc.) are stripped away. The expected behavior is that XML source is displayed as-is, with all tags visible.

**Note**: The original description incorrectly stated this was a pretty-print mode issue. The problem occurs in **raw mode** (pretty-print off), where XML files are served via the `/preview/` endpoint.

**Reproduction steps:**
1. Open `examples/text/sample.xml` in catscope.
2. Ensure pretty-print mode is OFF (raw view).
3. Observe that only the text content (e.g., "Catscope Release Notes", "Latest releases and updates...") is shown, with all XML markup removed.

**Expected:** XML source is displayed as plain text with all tags visible, the same as viewing it in a text editor.

**Actual:** XML tags are invisible, as if the browser is interpreting them as HTML/XML elements rather than displaying them as text.

## Context

The root cause is in how the `/preview/` endpoint serves XML files. In `mimetype.go`, `.xml` files are mapped to `application/xml` (line 25). When the browser receives `application/xml` in an iframe, it parses and renders the content as an XML document — displaying a tree view or stripping tags entirely, depending on the browser.

The fix should ensure XML files are served as `text/plain; charset=utf-8` in the `/preview/` endpoint so the browser displays the raw source text with whitespace preserved, the same as other text files. Alternatively, the MIME type mapping for `.xml` in the text file context could be overridden.

### Previous investigation (pretty-print mode)

A previous fix added `X-Content-Type-Options: nosniff` to the `/render/` endpoint, which addresses the pretty-print mode path. That fix remains valid but does not address this raw-mode issue.

### Likely fix approach

In `mimetype.go` or `server.go`, ensure that when serving XML files via `/preview/`, the Content-Type is `text/plain; charset=utf-8` instead of `application/xml`. This could be done by:
1. Adding `.xml` to the text MIME type list in `mimetype.go` (simplest)
2. Or overriding the Content-Type in the `/preview/` handler specifically for XML files

### Files affected

- `mimetype.go` — MIME type mapping for `.xml`
- `server.go` — `/preview/` handler (if override approach)

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: The issue is that `.xml` files are served as `application/xml` via `/preview/`, causing browsers to parse them as XML documents rather than displaying raw text. The fix is to serve `.xml` files as `text/plain; charset=utf-8` in the preview context, matching the behavior of other text files. This is unambiguous — raw preview should show source text, not parsed XML. The previous fix (adding `nosniff` header to `/render/`) addressed pretty-print mode and remains valid.
- **Triaged on**: 2026-04-18

## Resolution
