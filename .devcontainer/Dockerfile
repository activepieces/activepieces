# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 20, 18, 16, 14, 20-bullseye, 18-bullseye, 16-bullseye, 14-bullseye, 20-buster, 18-buster, 16-buster, 14-buster
ARG VARIANT=20-bullseye

# Build nsjail from source
FROM debian:bullseye-slim AS nsjail-build

RUN apt-get update && apt-get install -y --no-install-recommends \
    autoconf bison flex gcc g++ git ca-certificates libprotobuf-dev libnl-route-3-dev \
    libtool make pkg-config protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --branch 3.4 https://github.com/google/nsjail.git /nsjail \
    && cd /nsjail \
    && make clean \
    && make

FROM mcr.microsoft.com/devcontainers/javascript-node:0-${VARIANT}

RUN npm install -g nx
RUN apt-get update && apt-get install -y git

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
    locales-all \
    libcap-dev \
    libprotobuf23 \
    libnl-route-3-200 \
 && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y poppler-utils poppler-data

# Set the locale
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

COPY --from=nsjail-build /nsjail/nsjail /usr/bin/nsjail

RUN npm i -g bun@1.3.1 npm@9.9.3 cross-env@7.0.3

# install isolated-vm in a parent directory to avoid linking the package in every sandbox
RUN cd /usr/src && bun i isolated-vm@5.0.1
