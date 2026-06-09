# [Choice] Node.js version: 24, 22, 20
ARG VARIANT=24-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node:${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"

RUN npm install -g turbo
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

RUN npm i -g bun@1.3.1 cross-env@7.0.3 esbuild@0.25.0 @anthropic-ai/claude-code


# install isolated-vm in a parent directory to avoid linking the package in every sandbox
RUN cd /usr/src && bun i isolated-vm@6.0.2
