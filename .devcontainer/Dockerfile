# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 20, 18, 16, 14, 20-bullseye, 18-bullseye, 16-bullseye, 14-bullseye, 20-buster, 18-buster, 16-buster, 14-buster
ARG VARIANT=20-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"

RUN npm install -g @angular/cli
RUN npm install -g nx
RUN apt-get update && apt-get install -y git

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
    locales-all \
    libcap-dev \
 && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y poppler-utils poppler-data

# Set the locale
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

COPY default.cf /usr/local/etc/isolate

RUN npm i -g npm@9.9.3
RUN npm i -g pnpm@9.15.0
RUN npm i -g cross-env@7.0.3

RUN pnpm config set store-dir /root/.local/share/pnpm/store

# Update to use Node.js 20 packages
RUN pnpm store add @tsconfig/node20@20.1.4
RUN pnpm store add @types/node@20.14.8
RUN pnpm store add typescript@4.9.4
