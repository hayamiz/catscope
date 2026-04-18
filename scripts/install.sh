#!/bin/sh
set -e

REPO="hayamiz/catscope"

# Determine install directory (priority: env var > root > XDG_BIN_HOME > ~/bin)
if [ -n "$CATSCOPE_INSTALL_DIR" ]; then
  INSTALL_DIR="$CATSCOPE_INSTALL_DIR"
elif [ "$(id -u)" -eq 0 ]; then
  INSTALL_DIR="/usr/local/bin"
elif [ -n "$XDG_BIN_HOME" ]; then
  INSTALL_DIR="$XDG_BIN_HOME"
else
  INSTALL_DIR="$HOME/bin"
fi

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
  *) echo "WARNING: ${INSTALL_DIR} is not in your PATH. Add it to use catscope from anywhere." ;;
esac
