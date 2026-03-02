FROM node:20.19-bullseye-slim AS base

# Set environment variables early for better layer caching
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# Install all system dependencies in a single layer with cache mounts
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        openssh-client \
        python3 \
        g++ \
        build-essential \
        git \
        poppler-utils \
        poppler-data \
        procps \
        locales \
        unzip \
        curl \
        ca-certificates \
        libcap-dev && \
    yarn config set python /usr/bin/python3 && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen en_US.UTF-8

RUN export ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
      curl -fSL https://github.com/oven-sh/bun/releases/download/bun-v1.3.1/bun-linux-x64-baseline.zip -o bun.zip; \
    elif [ "$ARCH" = "aarch64" ]; then \
      curl -fSL https://github.com/oven-sh/bun/releases/download/bun-v1.3.1/bun-linux-aarch64.zip -o bun.zip; \
    fi

RUN unzip bun.zip \
    && mv bun-*/bun /usr/local/bin/bun \
    && chmod +x /usr/local/bin/bun \
    && rm -rf bun.zip bun-*

RUN bun --version

# Install global npm packages in a single layer
RUN --mount=type=cache,target=/root/.npm \
    npm install -g --no-fund --no-audit \
    node-gyp \
    npm@9.9.3 \
    pm2@6.0.10 \
    typescript@4.9.4

# Install isolated-vm globally (needed for sandboxes)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    cd /usr/src && bun install isolated-vm@5.0.1

### STAGE 1: Build ###
FROM base AS build

WORKDIR /usr/src/app

# Copy dependency files and workspace package.json files for resolution
COPY .npmrc package.json bun.lock bunfig.toml ./
COPY packages/ ./packages/

# Install all dependencies with frozen lockfile
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy remaining source code (turbo config, etc.)
COPY . .

# Build frontend, engine, and server API
RUN npx turbo run build --filter=web --filter=@activepieces/engine --filter=api

# Remove piece directories not needed at runtime (keeps only the 4 pieces api imports)
# Then regenerate bun.lock so it matches the trimmed workspace
RUN rm -rf packages/pieces/core packages/pieces/custom && \
    find packages/pieces/community -mindepth 1 -maxdepth 1 -type d \
      ! -name slack \
      ! -name square \
      ! -name facebook-leads \
      ! -name intercom \
      -exec rm -rf {} + && \
    rm -f bun.lock && bun install

### STAGE 2: Run ###
FROM base AS run

WORKDIR /usr/src/app

# Install Nginx and gettext in a single layer with cache mount
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends nginx gettext

# Copy static configuration files first (better layer caching)
COPY nginx.react.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/packages/server/api/src/assets/default.cf /usr/local/etc/isolate
COPY docker-entrypoint.sh .

# Create all necessary directories in one layer
RUN mkdir -p \
    /usr/src/app/dist/packages/engine && \
    chmod +x docker-entrypoint.sh

# Copy root config files needed for dependency resolution
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/.npmrc ./
COPY --from=build /usr/src/app/bun.lock ./
COPY --from=build /usr/src/app/bunfig.toml ./
COPY --from=build /usr/src/app/LICENSE .

# Copy workspace package.json files (needed for bun workspace resolution)
COPY --from=build /usr/src/app/packages ./packages

# Copy built engine
COPY --from=build /usr/src/app/dist/packages/engine/ ./dist/packages/engine/

# Regenerate lockfile and install production dependencies (pieces were trimmed from workspace)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production

# Copy frontend files to Nginx document root
COPY --from=build /usr/src/app/dist/packages/web /usr/share/nginx/html/

LABEL service=activepieces

ENTRYPOINT ["./docker-entrypoint.sh"]
EXPOSE 80
