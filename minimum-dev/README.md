# minimum-dev devcontainer template

A minimal devcontainer template for development with Claude Code (via AWS Bedrock).
This template does not assume any specific language runtime — use it as a base for new templates
or for projects that only need shell, git, and Claude Code.

## Usage

Copy the `.devcontainer/` directory into your project root:

```bash
cp -rL /path/to/templates/minimum-dev/.devcontainer /your/project/
```

> **Note:** Use `cp -rL` to follow symlinks and copy the actual files (build.sh, shell.sh).

## Customization

### Container name
Edit `.devcontainer/devcontainer.json`:
```json
"name": "Your Project Name"
```

### Node.js version
Edit `.devcontainer/Dockerfile`:
```dockerfile
ARG NODE_MAJOR=22
```

### Port forwarding
Edit `.devcontainer/devcontainer.json`:
```json
"forwardPorts": [8080]
```

### Claude Code permissions
Edit `.devcontainer/inside-container.settings.local.json` to add container-specific allowed commands. This file is mounted as `.claude/settings.local.json` inside the container, overriding the project-level `.claude/settings.json`.

## Helper scripts

- `.devcontainer/build.sh` — Build the devcontainer image
- `.devcontainer/shell.sh` — Start the container and open an interactive shell

Both scripts require the `devcontainer` CLI to be installed on the host.

## Prerequisites

- Docker
- [devcontainer CLI](https://github.com/devcontainers/cli): `npm install -g @devcontainers/cli`
- AWS credentials configured (for Claude Code via Bedrock)
- `gh` CLI authenticated (for GitHub operations)
