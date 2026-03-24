#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export UID
export GID="$(id -g)"

exec devcontainer exec --workspace-folder "$PROJECT_DIR" bash
