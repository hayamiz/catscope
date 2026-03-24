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
./scripts/devcontainer-build.sh
```

This builds the Docker image defined in `.devcontainer/Dockerfile`, passing your host UID/GID so that file permissions are consistent between host and container.

## Entering the Dev Container

To open a bash shell inside the container:

```bash
./scripts/devcontainer-shell.sh
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

## Versioning

The version string is injected at build time via `-ldflags`:

```bash
go build -ldflags="-s -w -X main.version=2.0.0" -o catscope .
```

Development builds default to `dev`. Always update [NEWS.md](NEWS.md) when preparing a release.

## Creating a Release

1. Update `NEWS.md` with the new version's changes.

2. Commit the release notes:

   ```bash
   git add NEWS.md
   git commit -m "Release v2.x.x"
   ```

3. Create a git tag:

   ```bash
   git tag v2.x.x
   git push origin v2.x.x
   ```

4. Build the release binary:

   ```bash
   VERSION=2.x.x
   GOOS=linux GOARCH=amd64 go build -ldflags="-s -w -X main.version=${VERSION}" -o catscope-linux-amd64 .
   ```

5. Create the GitHub release with `gh`:

   ```bash
   gh release create v${VERSION} \
     --title "v${VERSION}" \
     --notes-file <(sed -n "/^## v${VERSION}/,/^## v/{ /^## v${VERSION}/d; /^## v/d; p; }" NEWS.md) \
     catscope-linux-amd64
   ```

   This extracts the relevant section from `NEWS.md` as the release notes and attaches the binary.

## Using with VSCode

Alternatively, open the project in VSCode and run **Dev Containers: Reopen in Container** from the command palette (`Ctrl+Shift+P`).
