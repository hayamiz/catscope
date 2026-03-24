#!/bin/sh
set -e

REPO="hayamiz/catscope"
INSTALL_DIR="${CATSCOPE_INSTALL_DIR:-$HOME/bin}"

# Detect platform
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  aarch64) ARCH="arm64" ;;
  *)
    echo "Error: unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

BINARY="catscope-${OS}-${ARCH}"
URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"

echo "Installing catscope to ${INSTALL_DIR}/catscope ..."

mkdir -p "$INSTALL_DIR"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$URL" -o "${INSTALL_DIR}/catscope"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "${INSTALL_DIR}/catscope" "$URL"
else
  echo "Error: curl or wget is required" >&2
  exit 1
fi

chmod +x "${INSTALL_DIR}/catscope"

echo "Installed: ${INSTALL_DIR}/catscope"
"${INSTALL_DIR}/catscope" --version

# Check PATH
case ":$PATH:" in
  *":${INSTALL_DIR}:"*) ;;
  *) echo "Note: Add ${INSTALL_DIR} to your PATH if not already done." ;;
esac
