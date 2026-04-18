---
id: "0009"
title: "Revise install script destination logic with XDG and root support"
type: enhancement
priority: medium
status: resolved
created: 2026-04-17
updated: 2026-04-18
---

## Description

Revise the install script so that the install destination is determined by the following priority order:

1. **`CATSCOPE_INSTALL_DIR` environment variable** — If set, always install here regardless of other conditions.
2. **Running as root** — Install to `/usr/local/bin`.
3. **Non-root with XDG environment variables** — If `XDG_*` variables (e.g., `XDG_BIN_HOME`) are set, follow the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/) to determine the appropriate install location. (Requires reading the spec to determine exact semantics — see Context.)
4. **Non-root fallback** — Install to `~/bin/`.

After installation, the script must:

- Print the absolute path of the installed `catscope` binary.
- Check whether the install destination directory is in the user's `$PATH`.
- If not in `$PATH`, display a warning message advising the user to add it.

## Context

The current install script does not account for different execution contexts (root vs non-root) or respect XDG conventions. This enhancement makes the install script more robust and standards-compliant.

Key design work needed:

- **XDG spec review**: The XDG Base Directory Specification primarily defines directories for config, data, cache, and state — not executables. However, `XDG_BIN_HOME` is a proposed/draft addition (defaulting to `$HOME/.local/bin`). The spec needs to be reviewed to confirm the correct directory for binary installation when XDG variables are present. `$HOME/.local/bin` is the de facto standard on most Linux distributions.
- **Detection of root**: Use `id -u` or `$EUID` to check for root.
- **PATH check**: After install, resolve the absolute path of the installed binary and verify the containing directory appears in `$PATH`. If missing, emit a warning like: `WARNING: <dir> is not in your PATH. Add it to use catscope from anywhere.`

## Implementation Notes

Current install script (`scripts/install.sh`) uses `CATSCOPE_INSTALL_DIR` with fallback to `$HOME/bin`. No root detection or XDG support.

### Resolved decision points

1. **XDG_BIN_HOME handling** — only use when explicitly set; no `$HOME/.local/bin` fallback
2. **Root detection method** — `id -u` (POSIX portable)
3. **Priority order** — as documented: `CATSCOPE_INSTALL_DIR` → root (`/usr/local/bin`) → `XDG_BIN_HOME` (if set) → `~/bin`

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: All design decisions are resolved. The current `scripts/install.sh` already handles `CATSCOPE_INSTALL_DIR` (with fallback to `$HOME/bin`), prints the installed path, and performs a PATH check. The change is to replace the single-line `INSTALL_DIR="${CATSCOPE_INSTALL_DIR:-$HOME/bin}"` (line 5) with a 4-way if/elif chain: (1) `CATSCOPE_INSTALL_DIR` if set, (2) `/usr/local/bin` if `id -u` equals 0, (3) `$XDG_BIN_HOME` if set, (4) `$HOME/bin` fallback. The existing PATH-check block (lines 42-45) should also be updated to use a "WARNING:" prefix instead of the current soft "Note:" wording. No new files, no architectural changes, no ambiguity.
- **Triaged on**: 2026-04-18

## Resolution

Replaced the single-line `CATSCOPE_INSTALL_DIR` fallback with a 4-way priority chain in `scripts/install.sh`: (1) `CATSCOPE_INSTALL_DIR` if set, (2) `/usr/local/bin` if root (`id -u` == 0), (3) `$XDG_BIN_HOME` if set, (4) `$HOME/bin` fallback. Updated PATH check message from "Note:" to "WARNING:" prefix.