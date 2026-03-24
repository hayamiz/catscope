#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export UID
export GID="$(id -g)"

echo "Building devcontainer (UID=$UID, GID=$GID)..."
devcontainer build --workspace-folder "$PROJECT_DIR"
echo "Build complete."
