---
id: "0022"
title: "Enable pretty-print by default and add more programming language extensions"
type: enhancement
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

Two related changes to the pretty-print (render toggle) feature:

### 1. Default pretty-print to ON

Currently `prettyMode` defaults to `false` in `PreviewWindow`. Change it to default to `true` so that renderable files are shown in pretty-printed mode when first opened. Users can still toggle it off with the existing button.

### 2. Add missing programming language extensions to RENDERABLE_EXTENSIONS

The current list in `frontend/js/app.js` is:

```
.md, .json, .yaml, .yml,
.go, .py, .js, .c, .sql, .css, .html, .xml,
.toml, .log, .txt, .csv, .tsv
```

**Definitely add** (requested by user):
- `.cpp`, `.hpp` — C++
- `.h` — C/C++ headers

**Proposed additions** (awaiting user confirmation):

#### Systems programming / compiled languages
- `.rs` — Rust
- `.zig` — Zig
- `.nim` — Nim
- `.cr` — Crystal
- `.odin` — Odin
- `.jai` — Jai
- `.hare` — Hare
- `.c3` — C3
- `.d` — D
- `.ada`, `.adb`, `.ads` — Ada
- `.f90`, `.f95`, `.f03`, `.f08` — Modern Fortran
- `.swift` — Swift
- `.m` — Objective-C
- `.mm` — Objective-C++
- `.java` — Java
- `.cs` — C#
- `.kt`, `.kts` — Kotlin
- `.scala` — Scala
- `.dart` — Dart
- `.v` — V / Vlang

#### Scripting / dynamic languages
- `.ts`, `.tsx`, `.jsx` — TypeScript / React JSX
- `.rb` — Ruby
- `.php` — PHP
- `.pl`, `.pm` — Perl
- `.lua` — Lua
- `.r`, `.R` — R
- `.jl` — Julia
- `.sh`, `.bash`, `.zsh` — Shell scripts
- `.ps1` — PowerShell
- `.fish` — Fish shell

#### Functional languages
- `.hs` — Haskell
- `.ml`, `.mli` — OCaml
- `.fs`, `.fsi`, `.fsx` — F#
- `.ex`, `.exs` — Elixir
- `.erl`, `.hrl` — Erlang
- `.clj`, `.cljs`, `.cljc` — Clojure
- `.lisp`, `.cl` — Common Lisp
- `.scm`, `.ss` — Scheme
- `.rkt` — Racket
- `.el` — Emacs Lisp
- `.gleam` — Gleam

#### WebAssembly / low-level IR
- `.wat`, `.wast` — WebAssembly text format
- `.ll` — LLVM IR
- `.s`, `.S`, `.asm` — Assembly

#### Config / Infrastructure / Data
- `.tf`, `.hcl` — Terraform / HCL
- `.proto` — Protocol Buffers
- `.graphql`, `.gql` — GraphQL
- `.dockerfile` — Dockerfile
- `.mk` — Make
- `.cmake` — CMake
- `.nix` — Nix
- `.dhall` — Dhall
- `.jsonnet`, `.libsonnet` — Jsonnet
- `.ron` — RON (Rusty Object Notation)

#### Editor / tooling
- `.vim` — Vim script

## Context

Pretty-print mode provides syntax-highlighted rendering for source code files via the `/render/` endpoint. Having it default to ON gives a better out-of-the-box experience since most users expect to see formatted code. The extension list should be comprehensive enough to cover common programming languages encountered on development servers.

The render endpoint already supports highlighting for any text file, so adding extensions to `RENDERABLE_EXTENSIONS` simply enables the toggle button and default rendering for those file types.

## Resolution

<Filled in when resolved.>
