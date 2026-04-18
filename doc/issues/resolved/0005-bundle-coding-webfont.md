---
id: "0005"
title: "Bundle a coding-oriented web font for monospace display"
type: feature
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

The default monospace fonts on Windows (e.g., Consolas, Courier New) have poor readability for code and ASCII art. Catscope should bundle a high-quality, coding-oriented monospace web font in the binary (via `go:embed`) and use it as the default for all monospace display: code blocks, text file previews, ASCII art, etc.

### Requirements

1. **Font selection** -- Research and select a monospace font that:
   - Is designed for coding with good legibility (clear distinction between similar characters like `0/O`, `1/l/I`, etc.).
   - Has a permissive open-source license that allows bundling in a binary distribution (SIL Open Font License, Apache 2.0, etc.).
   - Supports a wide character range (Latin, box-drawing characters, common symbols).
   - Is available in WOFF2 format for efficient web delivery.
   - Has reasonable file size (ideally under 200KB for regular weight in WOFF2).

2. **Bundling** -- Embed the font file(s) via `go:embed` in the `frontend/` directory, consistent with how other static assets are handled.

3. **CSS integration** -- Define a `@font-face` rule in the stylesheet and apply the font to all monospace contexts (`pre`, `code`, `.text-preview`, etc.) with system monospace fonts as fallback.

4. **License compliance** -- Include the font's license file in the repository and ensure proper attribution is displayed (e.g., in an about/credits section or a `THIRD_PARTY_LICENSES` file).

### Candidate fonts to evaluate

| Font | License | Notes |
|---|---|---|
| **JetBrains Mono** | SIL OFL 1.1 | Popular coding font, ligature support, ~95KB WOFF2 |
| **Fira Code** | SIL OFL 1.1 | Widely used, ligatures, ~130KB WOFF2 |
| **Source Code Pro** | SIL OFL 1.1 | Adobe, clean design, ~60KB WOFF2 |
| **IBM Plex Mono** | SIL OFL 1.1 | IBM design language, ~70KB WOFF2 |
| **Hack** | MIT | Designed for source code, ~100KB WOFF2 |

## Context

Catscope is a self-contained binary with all assets embedded via `go:embed` and zero CDN dependencies. A bundled web font ensures consistent, readable monospace rendering across all platforms -- especially important on Windows where the system default is suboptimal. This also supports #0002 (ASCII art alignment) by providing a reliable monospace font with proper box-drawing character support.

License compliance is critical: the font's license must explicitly permit redistribution as part of a binary, and the license text must be included in the distribution.

## Triage

- **Complexity**: high
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All design decisions are now resolved (re-triaged 2026-04-18). The user has specified the fonts to bundle: **Fira Code, Ubuntu Mono, Victor Mono (without oblique variants)**.

  Research on Victor Mono oblique confirms skipping is correct:
  - No standard HTML element or CSS rule defaults to `font-style: oblique`. Nothing in catscope would trigger oblique rendering.
  - Google Fonts, Fontsource, and the official Victor Mono npm package all exclude oblique variants.
  - CSS fallback is graceful: if oblique is somehow requested, the browser serves the italic (cursive) variant instead.
  - Skipping oblique saves 521 KB (33% of Victor Mono's total) for zero functional loss.

  **All decisions resolved:**
  - Fonts: Fira Code (variable, ~110 KB), Ubuntu Mono (4 files, ~443 KB), Victor Mono upright+italic (14 files, ~1,072 KB)
  - Total font bundle: ~1.6 MB (~12% of current 13 MB binary)
  - Scope: all monospace within file preview windows only (not sidebar)
  - Font selection UI: header dropdown `<select>`, localStorage persistence
  - License: single `THIRD_PARTY_LICENSES` file in repo root
  - Implementation plan: 9 ordered steps fully documented in Implementation Notes below

  **Estimated effort**: ~4-6 hours (high complexity due to font sourcing, @font-face declarations for 19 font files, iframe style injection, and Playwright tests).

- **Triaged on**: 2026-04-18

## Implementation Notes

### Q1: Which fonts and weight variants to bundle

**Status: RESOLVED.**

**User decision**: Fira Code, Ubuntu Mono, Victor Mono. All weight variants. No file size limit. Victor Mono without oblique variants.

#### Fira Code (SIL OFL 1.1)

- **Weights**: Light, Regular, Medium, SemiBold, Bold (5 weights). No italic variant.
- **Variable font available**: Yes (single file covers all weights).
- **Box-drawing**: Excellent. Designed for console UIs, powerline glyphs, and box-drawing characters.
- **Notable features**: Programming ligatures, 31 character variants, 10 stylistic sets.
- **Recommendation**: Bundle the variable font (~110 KB). Covers all 5 weights in a single file.

#### Ubuntu Mono (Ubuntu Font License 1.0)

- **Weights**: Regular, Bold (+ italic for each = 4 styles total).
- **Box-drawing**: Included. 1,200 glyphs covering Latin, Cyrillic, Greek, and common symbols.
- **Notable features**: Clean humanist design, good 0/O/l/1 distinction.
- **WOFF2 sizes**: ~443 KB total (4 files).

#### Victor Mono (SIL OFL 1.1)

- **Weights**: Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold (7 weights).
- **Styles**: Upright + italic (cursive) only. Oblique excluded per user decision and research.
- **Notable features**: Distinctive cursive italics, 8 stylistic sets, programming ligatures.
- **WOFF2 sizes**: Upright ~480 KB + italic ~592 KB = **14 files, ~1,072 KB**.

#### Total binary size impact

| Font | Files | Size |
|---|---|---|
| Fira Code (variable) | 1 | ~110 KB |
| Ubuntu Mono | 4 | ~443 KB |
| Victor Mono (upright + italic) | 14 | ~1,072 KB |
| **Total** | **19** | **~1.6 MB** |

This adds ~12% to the current 13 MB binary. Reasonable for a dev tool.

### Q2: Font selector UI placement

**Recommendation: Header dropdown (inline in the title bar)**

Add a `<select>` element in the `#header` bar. The current header structure (`frontend/index.html` line 10) contains the app name, version span, and an optional logout button. The font selector would be placed between the version and the logout button.

- **Pros**: Immediately visible and accessible. No new panels or modals needed. Consistent with the minimal UI philosophy. Simple to implement (~20 lines JS, ~10 lines CSS).
- **Cons**: Takes header space, but the header currently has ample room.
- **Implementation**: The `<select>` contains one `<option>` per bundled font family. On change, update a CSS custom property (`--catscope-mono-font`) on `:root` and re-inject styles into open iframe preview windows.

The user has confirmed this approach ("この方針を採用").

### Q3: Persistence mechanism

**Recommendation: `localStorage`**

- Catscope is a single-user dev tool running on localhost. No user accounts, no server-side sessions.
- `localStorage` is the standard web API for client-side key/value persistence.
- Store as: `localStorage.setItem("catscope-font", "JetBrains Mono")`.
- On page load, read the stored value and apply before rendering to prevent a flash of unstyled font.
- If `localStorage` is unavailable (e.g., private browsing), fall back to the default font gracefully.
- Server-side persistence would add unnecessary complexity for zero benefit in this use case.

### Q4: Scope of application

**Confirmed by user**: File preview windows only.

Original user note:

> scope of application はファイルウィンドウ内で表示する全てのmonospaceを対象

("Scope is all monospace displayed within file windows.")

Concretely, this means:
1. **CSS `.csv-table` rule** (`frontend/css/style.css` line 215) -- currently uses `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`. Update to use the selected font via a CSS custom property.
2. **Text preview iframes** -- text files are rendered in `<iframe>` elements created by `PreviewWindow.prototype.loadContent` (`frontend/js/app.js`). Since iframes are same-origin, inject a `<style>` tag into `iframe.contentDocument` after load with the `@font-face` declarations and `body { font-family: ... }` rule.
3. **The sidebar file tree** (`#sidebar`) uses the system sans-serif font stack and is **NOT** affected.

### Q5: License file approach

**Recommendation: Single `THIRD_PARTY_LICENSES` file in the repository root**

- Standard approach for Go projects bundling third-party assets.
- Format: concatenate each font's copyright notice + full license text, separated by clear headers.
- If multiple fonts share the same license (e.g., SIL OFL 1.1), the license text can be included once with a note listing all covered fonts.

### Implementation plan (ordered steps)

All decisions are resolved. The implementation proceeds as follows:

1. **Add font files**: Create `frontend/fonts/` directory. Download WOFF2 files and place them there. The existing `go:embed frontend` directive in `main.go` (line 13) will automatically include them. The `handleAssets()` handler in `server.go` already serves `frontend/` at `/assets/`, so fonts will be available at `/assets/fonts/*.woff2` with zero backend changes.

2. **Add `@font-face` rules**: In `frontend/css/style.css`, add `@font-face` declarations for each bundled font family and weight. Use `font-display: swap` to prevent invisible text during loading.

3. **Add CSS custom property**: Define `--catscope-mono-font` on `:root` with a default value. Update the `.csv-table` `font-family` rule to use this property with system monospace as fallback.

4. **Add font selector UI**: In `frontend/index.html`, add a `<select id="font-selector">` in the `#header` div. In `frontend/js/app.js`, add initialization code that populates the select, reads from `localStorage`, and handles changes.

5. **Handle iframe font injection**: In `PreviewWindow.prototype.loadContent`, after creating each text iframe, add an `onload` handler that injects `@font-face` rules and the selected font-family into the iframe document.

6. **Persist preference**: On font selector change, save to `localStorage`. On page load, read and apply before any windows are created.

7. **Add `THIRD_PARTY_LICENSES`**: Create the license file in the repository root with the selected fonts' license texts.

8. **Update SPEC.md**: Add a section on bundled fonts, font selection UI, and the new `/assets/fonts/` path.

9. **Tests**: Add Playwright tests for: font selector visibility, font change persistence across reload, correct font-family on CSV table and text iframe content.

## Resolution

Bundled Fira Code (variable, 110KB), Ubuntu Mono (4 files, 107KB), Victor Mono (2 variable files, 56KB) as WOFF2 in `frontend/fonts/`. Added `@font-face` rules and `--catscope-mono-font` CSS custom property in `style.css`. Added `<select id="font-selector">` in header with localStorage persistence. Added `injectFontIntoIframe()` for text preview iframes. Updated `.csv-table` to use CSS custom property. `THIRD_PARTY_LICENSES` file deferred to #0013 due to content filter limitations.