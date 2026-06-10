FROM node:24.14.0-bullseye-slim

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    CI=true

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        iptables \
        libcap2-bin \
        ca-certificates \
        curl \
        locales \
        unzip \
        procps \
        python3 \
        g++ \
        build-essential && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen en_US.UTF-8 && \
    rm -rf /var/lib/apt/lists/*

RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
      curl -fsSL https://github.com/oven-sh/bun/releases/download/bun-v1.3.1/bun-linux-x64-baseline.zip -o /tmp/bun.zip; \
    else \
      curl -fsSL https://github.com/oven-sh/bun/releases/download/bun-v1.3.1/bun-linux-aarch64.zip -o /tmp/bun.zip; \
    fi && \
    unzip -q /tmp/bun.zip -d /tmp/bun && \
    mv /tmp/bun/bun-*/bun /usr/local/bin/bun && \
    chmod +x /usr/local/bin/bun && \
    rm -rf /tmp/bun /tmp/bun.zip

RUN npm install -g --no-fund --no-audit node-gyp

WORKDIR /usr/src/app

COPY .npmrc package.json bun.lock bunfig.toml ./
COPY packages/ ./packages/
COPY tools/ ./tools/
COPY tsconfig.base.json ./

# Skip native build scripts — integration tests don't need better-sqlite3/isolated-vm native modules.
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# isolate binary + config (checked into the repo under assets/; repo ships x86_64 and arm variants)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
      SRC=packages/server/api/src/assets/isolate; \
    else \
      SRC=packages/server/api/src/assets/isolate-arm; \
    fi && \
    install -m 0755 "$SRC" /usr/local/bin/isolate && \
    mkdir -p /usr/local/etc && \
    cp packages/server/api/src/assets/default.cf /usr/local/etc/isolate && \
    mkdir -p /var/local/lib/isolate && \
    mkdir -p /usr/src/node_modules

ENV E2E_LOG_LEVEL=warn

# cwd is the repo root — isolate.ts resolves its binary via `process.cwd() + packages/server/api/src/assets/…`.
WORKDIR /usr/src/app

CMD ["bun", "x", "vitest", "run", "--config", "packages/server/worker/test/e2e/vitest.config.ts"]
