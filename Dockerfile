FROM node:20.19-bullseye-slim AS base
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    NX_DAEMON=false \
    NX_NO_CLOUD=true

RUN apt-get update && \
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
        locales-all \
        unzip \
        curl \
        ca-certificates \
        libcap-dev && \
    yarn config set python /usr/bin/python3 && \
    rm -rf /var/lib/apt/lists/*

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

RUN npm install -g --no-fund --no-audit \
    node-gyp \
    npm@9.9.3 \
    pm2@6.0.10 \
    typescript@4.9.4

RUN cd /usr/src && bun install isolated-vm@5.0.1

### STAGE 1: Build ###
FROM base AS build
WORKDIR /usr/src/app
COPY .npmrc package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .
RUN npx nx run-many --target=build --projects=react-ui,server-api --configuration production --parallel=2 --skip-nx-cache

RUN cd dist/packages/server/api && \
    bun install --production --frozen-lockfile

### STAGE 2: Run ###
FROM base AS run
WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx gettext && \
    rm -rf /var/lib/apt/lists/*

COPY nginx.react.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/packages/server/api/src/assets/default.cf /usr/local/etc/isolate
COPY docker-entrypoint.sh .
RUN mkdir -p \
    /usr/src/app/dist/packages/server \
    /usr/src/app/dist/packages/engine \
    /usr/src/app/dist/packages/shared && \
    chmod +x docker-entrypoint.sh

COPY --from=build /usr/src/app/LICENSE .
COPY --from=build /usr/src/app/dist/packages/engine/ ./dist/packages/engine/
COPY --from=build /usr/src/app/dist/packages/server/ ./dist/packages/server/
COPY --from=build /usr/src/app/dist/packages/shared/ ./dist/packages/shared/
COPY --from=build /usr/src/app/packages ./packages
COPY --from=build /usr/src/app/dist/packages/react-ui /usr/share/nginx/html/

LABEL service=activepieces
ENTRYPOINT ["./docker-entrypoint.sh"]
EXPOSE 80
