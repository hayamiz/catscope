---
id: "0010"
title: "Display ASCII art banner on startup"
type: feature
priority: low
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

Display a decorative ASCII art banner showing the "catscope" name in the terminal when the server starts, similar to how CLI tools like Claude Code and opencode display their branding on launch.

The banner should:

- Use large, stylized text composed of ASCII/Unicode symbols to spell out "catscope" in a visually appealing way.
- Optionally include a cute cat motif (e.g., cat ears, whiskers) to match the project's name and personality.
- Include the version string below or beside the banner.
- Be printed to stderr (not stdout) so it doesn't interfere with piped output.
- Be suppressed when stdout/stderr is not a terminal (i.e., skip the banner when running in non-interactive contexts like CI or when output is redirected).
- Respect a `--quiet` or `-q` flag (if added) to disable the banner.

## Context

CLI tools with personality and visual identity create a more memorable user experience. Tools like Claude Code, opencode, and many Go CLI tools (e.g., Hugo, Caddy) display a styled banner at startup. Adding one to catscope reinforces the brand and makes the tool feel polished.

Design considerations:

- The banner text should be hardcoded as a Go string constant — no external dependencies or figlet-style libraries needed.
- Keep the banner compact (no more than ~6-8 lines tall) so it doesn't dominate the terminal.
- Use only ASCII characters or common box-drawing characters to ensure compatibility across terminals and fonts.
- Consider using `os.Stderr.Fd()` with `golang.org/x/term.IsTerminal()` or a simpler approach like checking `os.Getenv("TERM")` to detect interactive mode.
- `golang.org/x/term` is already a transitive dependency in go.mod — no new dependency needed for TTY detection.

## Banner Samples

Below are several banner design candidates. Run each shell snippet to preview in your terminal.

### Sample A: Clean block letters (minimal, Claude Code style)

```sh
cat <<'BANNER'
                _
   ___ __ _ ___| |_ ___  ___ ___  _ __   ___
  / __/ _` / __| __/ __|/ __/ _ \| '_ \ / _ \
 | (_| (_| \__ \ |_\__ \ (_| (_) | |_) |  __/
  \___\__,_|___/\__|___/\___\___/| .__/ \___|
                                 |_|
BANNER
```

### Sample B: Compact with cat ears

```sh
cat <<'BANNER'
  /\_/\
 ( o.o )  catscope
  > ^ <   v0.1.0
 /|   |\
(_|   |_)
BANNER
```

### Sample C: Box-drawing frame with cat motif

```sh
cat <<'BANNER'
 ╭─────────────────────────╮
 │  /\_/\   catscope       │
 │ ( o.o )  v0.1.0         │
 │  > ^ <   file browser   │
 ╰─────────────────────────╯
BANNER
```

### Sample D: Bold shadow letters (opencode style)

```sh
cat <<'BANNER'
  ██████╗ █████╗ ████████╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗
 ██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
 ██║     ███████║   ██║   ███████╗██║     ██║   ██║██████╔╝█████╗
 ██║     ██╔══██║   ██║   ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝
 ╚██████╗██║  ██║   ██║   ███████║╚██████╗╚██████╔╝██║     ███████╗
  ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═════╝╚═╝     ╚══════╝
BANNER
```

### Sample E: Slim with cat whiskers

```sh
cat <<'BANNER'
  =^..^=
 ╔═╗┌─┐┌┬┐┌─┐┌─┐┌─┐┌─┐┌─┐
 ║  ├─┤ │ └─┐│  │ │├─┘├┤
 ╚═╝┴ ┴ ┴ └─┘└─┘└─┘┴  └─┘
BANNER
```

### Sample F: Minimal one-liner with cat face

```sh
cat <<'BANNER'
 🐱 catscope v0.1.0 — file browser for remote dev servers
BANNER
```

### Sample G: Dotted outline (lightweight)

```sh
cat <<'BANNER'
        _
  _____| |_ ___ ___ ___ ___ ___
 |     | .'|  _|_ -|  _| . | . | -_|
 |_|_|_|__,|_| |___|___|___|  _|___|
                            |_|
  /\_/\  catscope
 ( o.o )
BANNER
```

Please review the samples above in your terminal and let me know which style (or combination) you prefer. I can then finalize the design and update the implementation.

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: Banner design is already decided (Sample E: slim with cat whiskers). The implementation is a contained change to `main.go` only. Steps: (1) add a `--quiet`/`-q` bool flag alongside the existing flags (lines 21-31); (2) add a `const banner` string with the Sample E art; (3) import `golang.org/x/term` (already an indirect dep at v0.41.0 in go.mod -- just needs promoting to direct); (4) after `flag.Parse()` and the version/self-update early exits, but before the existing startup prints (line 95), check `!*quiet && term.IsTerminal(int(os.Stderr.Fd()))` and if true, `fmt.Fprint(os.Stderr, banner)` with the version string appended. No spec changes needed since the banner is cosmetic stderr output. Run `go mod tidy` afterward to update the direct/indirect markers.
- **Triaged on**: 2026-04-18

## Resolution

Added Sample E banner as a `const banner` in `main.go`. Added `--quiet`/`-q` flag to suppress it. Banner prints to stderr only when `term.IsTerminal(os.Stderr.Fd())` is true and `--quiet` is not set. Promoted `golang.org/x/term` from indirect to direct dependency. Updated SPEC.md Section 2.2 and 2.4.