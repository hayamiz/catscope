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

## Using with VSCode

Alternatively, open the project in VSCode and run **Dev Containers: Reopen in Container** from the command palette (`Ctrl+Shift+P`).
