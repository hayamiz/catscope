# Development Environment Setup

## Prerequisites

- Docker (or a compatible container runtime such as Podman)
- Node.js and npm (for installing the devcontainer CLI)

## Installing the Dev Container CLI

Install the [Dev Container CLI](https://github.com/devcontainers/cli) globally via npm:

```bash
npm install -g @devcontainers/cli
```

Verify the installation:

```bash
devcontainer --version
```

## Building the Dev Container

Run the build script from the project root:

```bash
./etc/devcontainer-build.sh
```

This builds the Docker image defined in `.devcontainer/Dockerfile`, passing your host UID/GID so that file permissions are consistent between host and container.

## Entering the Dev Container

To open a bash shell inside the container:

```bash
./etc/devcontainer-shell.sh
```

This starts the container (if not already running) and drops you into an interactive bash session as the `ubuntu` user.

## Claude Code (AWS Bedrock)

This project uses Claude Code with AWS Bedrock as the backend. The Dev Container is pre-configured with the following environment variables:

```bash
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1
ANTHROPIC_MODEL='us.anthropic.claude-opus-4-6-v1'
ANTHROPIC_DEFAULT_HAIKU_MODEL='us.anthropic.claude-haiku-4-5-20251001-v1:0'
```

Authentication is role-based. The host instance (e.g., an EC2 instance) must have an IAM role attached that grants access to the Bedrock API. The container inherits the instance metadata credentials automatically, so no additional credential configuration is needed.

### Claude Code Settings Override

The Dev Container overrides the project-level Claude Code settings (`.claude/settings.json`) with a devcontainer-specific version. This is achieved via a bind mount in `.devcontainer/devcontainer.json`:

```
etc/devcontainer-settings.json  →  (mounted as)  .claude/settings.json
```

- **`.claude/settings.json`** — the project-level settings used on the host (outside the container).
- **`etc/devcontainer-settings.json`** — the settings applied inside the Dev Container. Edit this file to change permissions or other Claude Code settings for the containerized environment.

Both files are committed to the repository. When the Dev Container starts, the mount replaces `.claude/settings.json` with `devcontainer-settings.json`, so the host settings are not visible inside the container.

## Make Targets

Common tasks are available via `make`:

```bash
make help               # Show all targets
make build              # Build binary (dev, no version)
make build-release      # Build with version embedded
make build-release-linux # Cross-build linux/amd64 release binary
make vet                # Run go vet
make fmt                # Check formatting
make fmt-fix            # Auto-format all Go files
make lint               # Run vet + format check
make test               # Run Go unit tests
make test-cover         # Run tests with coverage report
make test-e2e           # Run Playwright integration tests
make test-all           # Run all tests (unit + e2e)
make release            # Create GitHub release (interactive)
make run                # Build and run the server
make clean              # Remove build artifacts
```

## Versioning

The canonical version number is stored in the `VERSION` file at the project root. The version string is injected at build time via `-ldflags`, reading from this file:

```bash
go build -ldflags="-s -w -X main.version=$(cat VERSION)" -o catscope .
```

Development builds (plain `go build`) default to `dev`. Always update both `VERSION` and [NEWS.md](NEWS.md) when preparing a release.

## Creating a Release

1. Update `VERSION` with the new version number:

   ```bash
   echo "2.x.x" > VERSION
   ```

2. Add a new section to `NEWS.md` with the release changes.

3. Commit and tag:

   ```bash
   VERSION=$(cat VERSION)
   git add VERSION NEWS.md
   git commit -m "Release v${VERSION}"
   git tag "v${VERSION}"
   git push origin "v${VERSION}"
   ```

4. Build the release binary:

   ```bash
   VERSION=$(cat VERSION)
   GOOS=linux GOARCH=amd64 go build -ldflags="-s -w -X main.version=${VERSION}" -o catscope-linux-amd64 .
   ```

5. Create the GitHub release with `gh`:

   ```bash
   VERSION=$(cat VERSION)
   gh release create "v${VERSION}" \
     --title "v${VERSION}" \
     --notes-file <(sed -n "/^## v${VERSION}/,/^## v/{ /^## v${VERSION}/d; /^## v/d; p; }" NEWS.md) \
     catscope-linux-amd64
   ```

   This extracts the relevant section from `NEWS.md` as the release notes and attaches the binary.

### GitHub authentication for `gh release create`

`gh` requires authentication via `gh auth login`. The token (classic PAT or fine-grained PAT) must have the following permissions:

| Token type | Required scope |
|---|---|
| Classic PAT | `repo` (Full control of private repositories) |
| Fine-grained PAT | **Contents**: Read and write, **Metadata**: Read-only |

For fine-grained PATs, the token must be scoped to the `hayamiz/catscope` repository (or the organization). The **Contents** permission covers both release creation and asset uploads.

## GitHub CLI (`gh`) Authentication in the Container

The Dev Container bind-mounts the host's `gh` config directory into the container so that `gh auth` credentials are shared. The mount source is determined by the `GH_CONFIG_DIR` environment variable on the host.

### CLI scripts (automatic)

The `etc/devcontainer-build.sh` and `etc/devcontainer-shell.sh` scripts automatically set `GH_CONFIG_DIR` to `${XDG_CONFIG_HOME:-$HOME/.config}/gh`, so no additional setup is needed.

### VSCode (manual setup required)

When opening the Dev Container from VSCode, the `GH_CONFIG_DIR` environment variable must be available in the host shell environment that VSCode inherits. Add the following to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export GH_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/gh"
```

Then restart VSCode (or reload the window) so it picks up the new variable.

## Using with VSCode

Alternatively, open the project in VSCode and run **Dev Containers: Reopen in Container** from the command palette (`Ctrl+Shift+P`).
