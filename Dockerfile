FROM node:24.14.0-bullseye-slim AS base

# Set environment variables early for better layer caching
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    NX_DAEMON=false \
    NX_NO_CLOUD=true \
    NX_DAEMON=false \
    NX_NO_CLOUD=true \
    NODE_OPTIONS="--max-old-space-size=4096"

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
        iptables \
        libcap-dev && \
    yarn config set python /usr/bin/python3 && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen en_US.UTF-8

RUN curl -fSL https://github.com/oven-sh/bun/releases/download/bun-v1.3.1/bun-linux-x64-baseline.zip -o bun.zip;

RUN unzip bun.zip \
    && mv bun-*/bun /usr/local/bin/bun \
    && chmod +x /usr/local/bin/bun \
    && rm -rf bun.zip bun-*

RUN bun --version

# Install global npm packages in a single layer
RUN --mount=type=cache,target=/root/.npm \
    npm install -g --no-fund --no-audit \
    node-gyp \
    npm@11.11.0 \
    pm2@6.0.10 \
    typescript@4.9.4 \
    esbuild@0.25.0

# Install isolated-vm globally (needed for sandboxes)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    cd /usr/src && bun install isolated-vm@6.0.2

### STAGE 1: Build ###
FROM base AS build

WORKDIR /usr/src/app

# Copy dependency files and workspace package.json files for resolution
COPY .npmrc package.json bun.lock bunfig.toml ./
COPY packages/ ./packages/

# Install all dependencies with frozen lockfile
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# Copy remaining source code (turbo config, etc.)
COPY . .

# Build frontend, engine, server API, and worker
RUN npx turbo run build --filter=web --filter=@activepieces/engine --filter=api --filter=worker

RUN for project in pieces-b2c2 pieces-bitgo pieces-chainalysis pieces-circle-pay pieces-mural-pay pieces-notabene pieces-one-money pieces-zroarb pieces-uuid pieces-persona; do \
      npx nx build $project --skip-nx-cache; \
    done
# RUN NODE_OPTIONS="--max-old-space-size=4096" npx nx run-many --target=build --projects=pieces-b2c2 --parallel=1 --skip-nx-cache
    # NODE_OPTIONS="--max-old-space-size=4096" npx nx run-many --target=build --projects=pieces-circle-pay,pieces-mural-pay --parallel=1 --skip-nx-cache && \
    # NODE_OPTIONS="--max-old-space-size=4096" npx nx run-many --target=build --projects=pieces-zroarb,pieces-zroswiss --parallel=1 --skip-nx-cache

# Install production dependencies only for the backend API
RUN --mount=type=cache,target=/root/.bun/install/cache \
    cd dist/packages/server/api && \
    bun install --production

### STAGE 2: Run ###
FROM base AS run

WORKDIR /usr/src/app

# Copy static configuration files first (better layer caching)
COPY --from=build /usr/src/app/packages/server/api/src/assets/default.cf /usr/local/etc/isolate
COPY docker-entrypoint.sh .

# Create all necessary directories in one layer
RUN mkdir -p \
    /usr/src/app/dist/packages/server \
    /usr/src/app/dist/packages/engine \
    /usr/src/app/dist/packages/pieces/custom \
    /usr/src/app/dist/packages/shared && \
    chmod +x docker-entrypoint.sh

# Copy root config files needed for dependency resolution
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/.npmrc ./
COPY --from=build /usr/src/app/bun.lock ./
COPY --from=build /usr/src/app/bunfig.toml ./
COPY --from=build /usr/src/app/LICENSE .

# Copy workspace package.json files (needed for bun workspace resolution)
COPY --from=build /usr/src/app/packages ./packages
COPY --from=build /usr/src/app/dist/packages/pieces/custom/ ./dist/packages/pieces/custom/

# Install dependencies for custom pieces (needed for runtime loading)
RUN for piece_dir in /usr/src/app/packages/pieces/custom/*/; do \
      if [ -f "$piece_dir/package.json" ]; then \
        echo "Installing dependencies for $(basename $piece_dir)..." && \
        cd "$piece_dir" && \
        bun install --no-save --silent || npm install --no-save --silent || true; \
      fi; \
    done

# Create script to register custom pieces in database
RUN echo '#!/bin/bash\n\
set -e\n\
cd /usr/src/app\n\
\n\
# Wait for database to be ready\n\
until node -e "require(\"pg\").Pool({connectionString: process.env.DATABASE_URL}).query(\"SELECT 1\").then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; do\n\
  echo "Waiting for database..."\n\
  sleep 2\n\
done\n\
\n\
# Register custom pieces using the API or direct database insert\n\
# This is a placeholder - you may need to create a proper script\n\
echo "Custom pieces should be registered via API endpoint /api/v1/pieces endpoint"\n\
' > /usr/src/app/register-custom-pieces.sh && \
    chmod +x /usr/src/app/register-custom-pieces.sh

# Copy built engine
COPY --from=build /usr/src/app/dist/packages/engine/ ./dist/packages/engine/

# Regenerate lockfile and install production dependencies (pieces were trimmed from workspace)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production

# Copy frontend files
COPY --from=build /usr/src/app/dist/packages/web ./dist/packages/web/

LABEL service=activepieces

ENTRYPOINT ["./docker-entrypoint.sh"]
EXPOSE 80
