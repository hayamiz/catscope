FROM ubuntu:24.04

ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG USER_GID=${USER_UID}

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Use Japanese mirrors for apt (JAIST/RIKEN/jp.archive) to avoid archive.ubuntu.com timeouts
RUN cat > /etc/apt/sources.list.d/ubuntu.sources <<'EOF'
Types: deb
URIs: http://ftp.jaist.ac.jp/pub/Linux/ubuntu/ http://ftp.riken.jp/Linux/ubuntu/ http://jp.archive.ubuntu.com/ubuntu/
Suites: noble noble-updates noble-backports
Components: main universe restricted multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: http://ftp.jaist.ac.jp/pub/Linux/ubuntu/ http://ftp.riken.jp/Linux/ubuntu/ http://jp.archive.ubuntu.com/ubuntu/
Suites: noble-security
Components: main universe restricted multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
EOF

# Install essential packages
RUN apt-get -o Acquire::Retries=3 update \
    && apt-get -o Acquire::Retries=3 install -y \
    ca-certificates \
    build-essential \
    curl \
    wget \
    git \
    gh \
    vim \
    sudo \
    openssh-client \
    gnupg \
    jq \
    ripgrep \
    fd-find \
    tree \
    less \
    file \
    unzip \
    zip \
    htop \
    strace \
    lsof \
    iproute2 \
    psmisc \
    net-tools \
    procps \
    dnsutils \
    locales \
    imagemagick \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Install Go 1.23
ARG GO_VERSION=1.23.6
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-$(dpkg --print-architecture).tar.gz" \
    | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}"

# Install Node.js (for Playwright e2e tests)
ARG NODE_MAJOR=22
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - \
    && apt-get -o Acquire::Retries=3 install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright system dependencies (requires root)
RUN npx playwright install-deps chromium

# Adjust UID/GID of the ubuntu user to match the host user
RUN if [ "$USER_UID" != "1000" ]; then \
        groupmod --gid $USER_GID $USERNAME \
        && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
        && chown -R $USER_UID:$USER_GID /home/$USERNAME; \
    fi

# Add user to sudoers
RUN echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} \
    && chmod 0440 /etc/sudoers.d/${USERNAME}

# Set GOPATH for the user
ENV GOPATH="/home/${USERNAME}/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Install Agent Package Manager (apm)
RUN curl -sSL https://aka.ms/apm-unix | sh

# Harden npm against supply-chain attacks
RUN printf 'ignore-scripts=true\nmin-release-age=7\n' >> /etc/npmrc

# Pre-create .config so bind mounts don't leave it owned by root
RUN mkdir -p /home/${USERNAME}/.config \
    && chown ${USERNAME}:${USERNAME} /home/${USERNAME}/.config

# Pre-create .claude and subdirectories for bind mounts
RUN mkdir -p /home/${USERNAME}/.claude/projects \
             /home/${USERNAME}/.claude/sessions \
    && chown -R ${USERNAME}:${USERNAME} /home/${USERNAME}/.claude

# Bedrock environment variables
ENV CLAUDE_CODE_USE_BEDROCK=1
ENV AWS_REGION=us-east-1
ENV ANTHROPIC_MODEL=us.anthropic.claude-opus-4-6-v1
ENV ANTHROPIC_DEFAULT_HAIKU_MODEL=us.anthropic.claude-haiku-4-5-20251001-v1:0

# Generate post-start initialization script
RUN { \
      echo '#!/usr/bin/env bash'; \
      echo 'set -euo pipefail'; \
      echo ''; \
      echo '# Copy Claude OAuth credentials from read-only mount'; \
      echo 'if [ -f /host-claude/.credentials.json ] || [ -L /host-claude/.credentials.json ]; then'; \
      echo '  mkdir -p "$HOME/.claude"'; \
      echo '  cp -L /host-claude/.credentials.json "$HOME/.claude/.credentials.json"'; \
      echo '  chmod 600 "$HOME/.claude/.credentials.json"'; \
      echo 'fi'; \
      echo 'if [ -f /host-claude.json ] || [ -L /host-claude.json ]; then'; \
      echo '  cp -L /host-claude.json "$HOME/.claude.json"'; \
      echo 'fi'; \
      echo ''; \
      echo '# Fix ownership of workspace .claude dir auto-created as root by bind mounts'; \
      echo 'sudo mkdir -p "$PWD/.claude"'; \
      echo "sudo chown -R ${USERNAME}:${USERNAME} \"\$PWD/.claude\""; \
    } > /usr/local/bin/devcontainer-post-start.sh \
    && chmod +x /usr/local/bin/devcontainer-post-start.sh

USER ${USERNAME}
WORKDIR /home/${USERNAME}

# Install Playwright Chromium browser (as non-root so it goes to ~/.cache/ms-playwright/)
RUN npx playwright install chromium
