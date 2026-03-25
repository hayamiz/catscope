#!/bin/bash
set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
error() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

info() {
    echo -e "${CYAN}$1${NC}"
}

prompt_yn() {
    local prompt="$1"
    local response
    while true; do
        read -r -p "$(echo -e "${CYAN}${prompt} [y/n]:${NC} ")" response
        case "$response" in
            [yY]|[yY][eE][sS]) return 0 ;;
            [nN]|[nN][oO]) return 1 ;;
            *) echo "Please answer y or n." ;;
        esac
    done
}

prompt_input() {
    local prompt="$1"
    local response
    read -r -p "$(echo -e "${CYAN}${prompt}:${NC} ")" response
    echo "$response"
}

# Phase 1: Prerequisites Check
echo ""
info "==> Phase 1: Prerequisites Check"
echo ""

# Check if in git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi
success "Git repository detected"

# Run git fetch
info "Fetching remote refs..."
if ! git fetch; then
    error "git fetch failed"
fi
success "Remote refs updated"

# Check gh authentication
info "Checking GitHub CLI authentication..."
if ! gh auth status &>/dev/null; then
    error "GitHub CLI not authenticated. Run: gh auth login"
fi
success "GitHub CLI authenticated"

# Phase 2: Version Validation
echo ""
info "==> Phase 2: Version Validation"
echo ""

if [ ! -f VERSION ]; then
    error "VERSION file not found"
fi

VERSION=$(cat VERSION)
info "Current VERSION file: ${VERSION}"

# Get latest release
LATEST_RELEASE=$(gh release list --limit 1 | awk '{print $1}' || echo "")
if [ -n "$LATEST_RELEASE" ]; then
    info "Latest GitHub release: ${LATEST_RELEASE}"

    if [ "v${VERSION}" = "$LATEST_RELEASE" ]; then
        warn "VERSION matches the latest release! This appears to be a duplicate."
    fi
else
    info "No existing releases found"
fi

echo ""
if ! prompt_yn "Is VERSION file (${VERSION}) correct?"; then
    NEW_VERSION=$(prompt_input "Enter new version number")
    echo "$NEW_VERSION" > VERSION
    VERSION="$NEW_VERSION"
    success "VERSION file updated to: ${VERSION}"
fi

# Phase 3: NEWS.md Check
echo ""
info "==> Phase 3: NEWS.md Check"
echo ""

if [ ! -f NEWS.md ]; then
    error "NEWS.md file not found"
fi

# Check if NEWS.md has section for this version
if grep -q "^## v${VERSION}" NEWS.md; then
    success "NEWS.md has entry for v${VERSION}"
    echo ""
    info "Release notes preview:"
    echo "---"
    sed -n "/^## v${VERSION}/,/^## v/{/^## v${VERSION}/d;/^## v/d;p;}" NEWS.md | head -20
    echo "---"
    echo ""
else
    warn "NEWS.md does not have an entry for v${VERSION}"
    echo ""
    info "How would you like to create the NEWS.md entry?"
    echo "  1) Generate with Claude Code (experimental)"
    echo "  2) Edit manually"
    echo ""

    CHOICE=$(prompt_input "Enter choice [1-2]")

    case "$CHOICE" in
        1)
            info "Generating NEWS.md entry with Claude Code..."
            LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
            PROMPT="Generate a NEWS.md entry for version ${VERSION} by reviewing git commits"
            if [ -n "$LAST_TAG" ]; then
                PROMPT="${PROMPT} since ${LAST_TAG}"
            fi
            PROMPT="${PROMPT}. Follow the format used in NEWS.md. Include a brief summary and list of features/changes."

            info "Running: claude \"${PROMPT}\""
            if claude "$PROMPT"; then
                success "Claude Code completed"
                info "Please verify the generated entry in NEWS.md"
                read -r -p "Press Enter to continue..."
            else
                warn "Claude Code generation failed or was cancelled"
                info "Please edit NEWS.md manually"
                read -r -p "Press Enter when NEWS.md is ready..."
            fi
            ;;
        2)
            info "Please edit NEWS.md to add a section for v${VERSION}"
            info "Expected format:"
            echo ""
            echo "## v${VERSION} ($(date +%Y-%m-%d))"
            echo ""
            echo "### Features"
            echo "- Feature 1"
            echo "- Feature 2"
            echo ""
            read -r -p "Press Enter when NEWS.md is ready..."
            ;;
        *)
            error "Invalid choice"
            ;;
    esac

    # Re-check if section exists now
    if ! grep -q "^## v${VERSION}" NEWS.md; then
        error "NEWS.md still does not have an entry for v${VERSION}"
    fi
    success "NEWS.md entry confirmed for v${VERSION}"
fi

# Phase 4: Build Release Binary
echo ""
info "==> Phase 4: Build Release Binary"
echo ""

info "Building release binary (linux/amd64)..."
if ! make build-release-linux; then
    error "Release build failed"
fi

BINARY="catscope-linux-amd64"
if [ ! -f "$BINARY" ]; then
    error "Release binary not found: ${BINARY}"
fi

success "Release binary built: ${BINARY}"

# Phase 5: Create Git Tag
echo ""
info "==> Phase 5: Create Git Tag"
echo ""

TAG="v${VERSION}"
if git rev-parse "$TAG" >/dev/null 2>&1; then
    warn "Tag ${TAG} already exists locally"
    if ! prompt_yn "Continue anyway?"; then
        error "Aborted by user"
    fi
fi

echo ""
if prompt_yn "Create and push git tag ${TAG}?"; then
    git tag "$TAG"
    success "Tag ${TAG} created"

    git push origin "$TAG"
    success "Tag ${TAG} pushed to origin"
else
    error "Git tag creation cancelled. You can complete the release manually with:\n  git tag ${TAG}\n  git push origin ${TAG}\n  gh release create ${TAG} --title ${TAG} --notes-file <(sed -n \"/^## v${VERSION}/,/^## v/{/^## v${VERSION}/d;/^## v/d;p;}\" NEWS.md) ${BINARY}"
fi

# Phase 6: Create GitHub Release
echo ""
info "==> Phase 6: Create GitHub Release"
echo ""

info "Extracting release notes from NEWS.md..."
RELEASE_NOTES=$(sed -n "/^## v${VERSION}/,/^## v/{/^## v${VERSION}/d;/^## v/d;p;}" NEWS.md)

if [ -z "$RELEASE_NOTES" ]; then
    warn "No release notes found in NEWS.md"
    RELEASE_NOTES="Release v${VERSION}"
fi

echo ""
info "Release notes preview:"
echo "---"
echo "$RELEASE_NOTES" | head -20
echo "---"
echo ""

if prompt_yn "Create GitHub release ${TAG} with these notes?"; then
    info "Creating GitHub release..."
    RELEASE_URL=$(gh release create "$TAG" \
        --title "$TAG" \
        --notes "$RELEASE_NOTES" \
        "$BINARY" | grep -o 'https://[^ ]*' || echo "")

    if [ -n "$RELEASE_URL" ]; then
        success "GitHub release created: ${RELEASE_URL}"
    else
        success "GitHub release created"
        RELEASE_URL="https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/${TAG}"
        info "Release URL: ${RELEASE_URL}"
    fi
else
    error "GitHub release cancelled. You can complete the release manually with:\n  gh release create ${TAG} --title ${TAG} --notes-file <(sed -n \"/^## v${VERSION}/,/^## v/{/^## v${VERSION}/d;/^## v/d;p;}\" NEWS.md) ${BINARY}"
fi

# Phase 7: Summary
echo ""
info "==> Phase 7: Summary"
echo ""

success "Release v${VERSION} completed successfully!"
echo ""
info "Release details:"
echo "  - Version: ${VERSION}"
echo "  - Tag: ${TAG}"
echo "  - Binary: ${BINARY}"
if [ -n "$RELEASE_URL" ]; then
    echo "  - URL: ${RELEASE_URL}"
fi
echo ""
info "Cleanup recommendation:"
echo "  make clean    # Remove build artifacts"
echo ""
