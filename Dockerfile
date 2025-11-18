FROM node:20.19-bullseye-slim AS base

# Use a cache mount for apt to speed up the process
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
        procps && \
    yarn config set python /usr/bin/python3 && \
    npm install -g node-gyp
RUN npm i -g bun@1.3.1 npm@9.9.3 pm2@6.0.10 typescript@4.9.4

# Set the locale
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
ENV NX_DAEMON=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
    locales-all \
    libcap-dev \
 && rm -rf /var/lib/apt/lists/*

# install isolated-vm in a parent directory to avoid linking the package in every sandbox
RUN cd /usr/src && bun i isolated-vm@5.0.1

### STAGE 1: Build ###
FROM base AS build

# Set up backend
WORKDIR /usr/src/app

COPY .npmrc package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

COPY . .

# Set NX_NO_CLOUD environment variable
ENV NX_NO_CLOUD=true

RUN npx nx run-many --target=build --projects=react-ui --skip-nx-cache
RUN npx nx run-many --target=build --projects=server-api --configuration production --skip-nx-cache

# Install backend production dependencies
RUN --mount=type=cache,target=/root/.bun/install/cache \
    cd dist/packages/server/api && bun install --production --force

### STAGE 2: Run ###
FROM base AS run

# Set up backend
WORKDIR /usr/src/app

# Install Nginx and gettext for envsubst
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY nginx.react.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /usr/src/app/dist/packages/server/ \
    /usr/src/app/dist/packages/engine/ \
    /usr/src/app/dist/packages/shared/

# Copy built files from build stage (includes node_modules from build stage)
COPY --from=build /usr/src/app/LICENSE .
COPY --from=build /usr/src/app/dist/packages/engine/ /usr/src/app/dist/packages/engine/
COPY --from=build /usr/src/app/dist/packages/server/ /usr/src/app/dist/packages/server/
COPY --from=build /usr/src/app/dist/packages/shared/ /usr/src/app/dist/packages/shared/
COPY --from=build /usr/src/app/packages/server/api/src/assets/default.cf /usr/local/etc/isolate

# Copy packages directory (needed for runtime)
COPY --from=build /usr/src/app/packages packages
# Copy frontend files to Nginx document root directory from build stage
COPY --from=build /usr/src/app/dist/packages/react-ui /usr/share/nginx/html/

LABEL service=activepieces

# Set up entrypoint script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 80