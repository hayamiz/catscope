FROM ubuntu:24.04

ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG USER_GID=${USER_UID}

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    sudo \
    wget \
    ca-certificates \
    build-essential \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Install Go 1.23
ARG GO_VERSION=1.23.6
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-$(dpkg --print-architecture).tar.gz" \
    | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}"

# Install Node.js (for Playwright e2e tests)
ARG NODE_MAJOR=22
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

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

USER ${USERNAME}
WORKDIR /home/${USERNAME}
