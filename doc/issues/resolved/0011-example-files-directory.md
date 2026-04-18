---
id: "0011"
title: "Create example files directory for manual testing"
type: chore
priority: low
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

Create an `examples/` directory containing sample files of various types, used for manual testing and verification of catscope's file browsing and preview features.

### Proposed directory structure

```
examples/
├── images/
│   ├── sample.jpg          (ImageMagick generated, gradient+shape, ~2KB)
│   ├── sample.png          (ImageMagick generated, gradient+shape with transparency, ~3KB)
│   ├── sample.gif          (ImageMagick generated, animated 3-frame color cycle, ~1KB)
│   ├── sample.webp         (ImageMagick generated, gradient+shapes, <1KB)
│   └── sample.svg          (hand-crafted night scene: gradients, shapes, text, ~2KB)
├── documents/
│   ├── sample.pdf          (generated from README.md via pandoc+weasyprint)
│   └── sample.eps          (self-created minimal EPS or converted from CC0 Openclipart SVG)
├── text/
│   ├── sample.txt
│   ├── sample.md           (headings, code blocks, ASCII art, tables, inline code)
│   ├── sample.log
│   ├── sample.json         (nested structures)
│   ├── sample.yaml         (nested structures)
│   ├── sample.toml
│   ├── sample.xml
│   ├── sample.csv          (headers, multiple rows, numeric+string columns)
│   ├── sample.tsv          (headers, multiple rows, numeric+string columns)
│   └── sample.html         (generated from README.md via pandoc --standalone)
├── code/
│   ├── sample.go
│   ├── sample.py
│   ├── sample.js
│   ├── sample.c
│   ├── sample.sql
│   ├── Makefile
│   └── Dockerfile
├── video/
│   ├── sample.mp4          (ffmpeg SMPTE color bars, 320x240, 2s, ~3.4KB)
│   ├── sample.webm         (ffmpeg SMPTE color bars, 320x240, 2s, ~1.5KB)
│   ├── sample.avi          (ffmpeg SMPTE color bars, 320x240, 2s, ~57KB)
│   └── sample.mov          (ffmpeg SMPTE color bars, 320x240, 2s, ~3.3KB)
├── edge-cases/
│   ├── .hidden-file
│   ├── no-extension
│   ├── empty-file.txt      (0 bytes)
│   ├── unicode-名前.txt     (Unicode filename)
│   ├── large-file.txt      (generated, >1MB of text)
│   └── binary-file.bin     (non-text binary)
├── generate.sh             (reproducible generation script for binary assets)
└── README.md                (describes the purpose and contents)
```

### Content guidelines

- Files should contain meaningful, representative content — not just "hello world."
- The Markdown file should include headings, code blocks, ASCII art diagrams, tables, and inline code to exercise rendering edge cases (related to #0002).
- CSV/TSV files should have headers, multiple rows, numeric and string columns to test the table viewer (sorting, alignment).
- JSON/YAML should have nested structures.
- Edge-case files should test boundary conditions: hidden files, missing extensions, empty files, Unicode filenames, large files, and binary detection.
- Image files are generated programmatically with ImageMagick (gradient+shape overlays, ~1-3KB each). SVG is hand-crafted.
- Video files are generated with ffmpeg using SMPTE color bar test patterns (320x240, 10fps, 2s). All four formats total ~66KB.
- A `generate.sh` script documents and reproduces all binary asset generation (images, videos, PDF, HTML).

## Context

Currently there is no standardized set of test files for manual verification. Developers and testers must create their own ad-hoc files when checking feature behavior. A curated `examples/` directory provides a consistent, reproducible way to verify all supported file types and edge cases after changes.

This directory should be committed to the repository but excluded from release builds (it's for development use only).

## Triage

- **Complexity**: medium
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All research completed and decisions resolved (2026-04-18 re-triage). See Implementation Plan below for full details. No external asset downloads needed — all binary files are self-generated, eliminating licensing concerns. Scope is medium due to the number of files (~35) but each is straightforward to create.
- **Triaged on**: 2026-04-18

### Implementation Plan

#### Images (ImageMagick — all confirmed working, devcontainer has ImageMagick 6.9.12)

```bash
# JPG - purple gradient with translucent circle (~1.8KB)
convert -size 100x100 gradient:'#667eea'-'#764ba2' \
  -fill 'rgba(255,255,255,0.5)' -draw 'circle 50,50 50,25' sample.jpg

# PNG - pink gradient with translucent triangle (~3.4KB)
convert -size 100x100 gradient:'#f093fb'-'#f5576c' \
  -fill 'rgba(255,255,255,0.3)' -draw 'polygon 50,10 90,90 10,90' sample.png

# GIF - animated 3-frame color cycle (~948 bytes)
convert -size 100x100 -delay 30 \
  \( xc:none -fill '#E91E63' -draw 'circle 50,50 50,20' \) \
  \( xc:none -fill '#2196F3' -draw 'circle 50,50 50,20' \) \
  \( xc:none -fill '#4CAF50' -draw 'circle 50,50 50,20' \) \
  -loop 0 sample.gif

# WEBP - green gradient with circle and square (~320 bytes)
convert -size 100x100 gradient:'#43e97b'-'#38f9d7' \
  -fill 'rgba(0,0,0,0.2)' -draw 'circle 30,30 30,15' \
  -fill 'rgba(255,255,255,0.3)' -draw 'rectangle 55,55 85,85' sample.webp
```

#### SVG (hand-crafted, ~2KB)
Self-contained night scene with `linearGradient`, `radialGradient`, `circle`, `rect`, `polygon`, `text`, `opacity`, `viewBox`. No external dependencies.

#### EPS
Two options (both avoid licensing ambiguity):
1. Self-created minimal EPS file (simple PostScript drawing commands) — simplest
2. Convert a CC0 SVG from Openclipart via `inkscape --export-type=eps`

Recommendation: option 1 (self-created) for zero dependencies.

#### Videos (ffmpeg — SMPTE color bars, 320x240, 10fps, 2s)

```bash
# MP4 (~3.4KB)
ffmpeg -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p -movflags +faststart sample.mp4

# WebM (~1.5KB)
ffmpeg -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v libvpx-vp9 -crf 40 -b:v 0 -pix_fmt yuv420p sample.webm

# AVI (~57KB)
ffmpeg -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v mjpeg -q:v 15 -pix_fmt yuvj420p sample.avi

# MOV (~3.3KB)
ffmpeg -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p sample.mov
```

Note: catscope does not currently support video preview (#0013 to be created). Video files are included for file listing/download testing.

#### PDF and HTML (pandoc)

```bash
# HTML (standalone with embedded CSS)
pandoc README.md -o examples/text/sample.html --standalone --from=gfm

# PDF (requires weasyprint or typst as PDF engine)
pandoc README.md -o examples/documents/sample.pdf --pdf-engine=weasyprint
```

Devcontainer needs: `apt install pandoc weasyprint` (~200-400MB) or lighter `pandoc + typst` (~50MB).

#### Text/Code/Config files
All hand-written. Code files use hello-world-level samples. Config files (JSON, YAML, TOML, XML) use random settings with nested structures. Markdown follows GitHub wiki syntax reference style.

#### generate.sh
A shell script that reproduces all binary assets (images, videos, PDF, HTML). Pre-generated files are committed alongside it so the tools are only needed for regeneration.

## Resolution

Decisions finalized after research (2026-04-18):

- **Code files**: hello-world-level samples for each language.
- **Images**: all generated with ImageMagick (gradient+shape overlays). No external downloads needed. Zero licensing concerns.
- **SVG**: hand-crafted self-contained scene (~2KB) exercising gradients, shapes, text, opacity.
- **EPS**: self-created minimal EPS file (simple PostScript drawing). Avoids tiger.eps licensing ambiguity.
- **Videos**: ffmpeg-generated SMPTE color bars in MP4/WebM/AVI/MOV. All four total ~66KB.
- **Markdown**: GitHub wiki syntax reference style (headings, code blocks, ASCII art, tables).
- **Config files** (JSON/YAML/TOML/XML): random settings with nested structures and variety.
- **HTML**: generated from catscope README.md via `pandoc --standalone --from=gfm`.
- **PDF**: generated from catscope README.md via `pandoc --pdf-engine=weasyprint`.
- **generate.sh**: reproducible script for all binary asset generation.
Created `examples/` directory with 34 files across 6 subdirectories: images (5 files, ImageMagick + hand-crafted SVG), documents (1 EPS), text (9 files including MD, JSON, YAML, TOML, XML, CSV, TSV, log, txt), code (7 files: Go, Python, JS, C, SQL, Makefile, Dockerfile), video (4 files, ffmpeg SMPTE bars), edge-cases (6 files including hidden, no-extension, empty, Unicode, large, binary). Added `generate.sh` script and `README.md`. PDF/HTML generation skipped (pandoc not available in devcontainer).
