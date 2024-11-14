FROM node:18.20.4-bullseye-slim AS base

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
        poppler-data && \
    yarn config set python /usr/bin/python3 && \
    npm install -g node-gyp
RUN npm i -g npm@9.9.3 pnpm@9.12.1 cross-env@7.0.3

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
RUN cd /usr/src && npm i isolated-vm@5.0.1

RUN pnpm store add @tsconfig/node18@1.0.0
RUN pnpm store add @types/node@18.17.1

RUN pnpm store add typescript@4.9.4

### STAGE 1: Build ###
FROM base AS build

# Set up backend
WORKDIR /usr/src/app
COPY . .

COPY .npmrc package.json package-lock.json ./
RUN npm ci

RUN npx nx run-many --target=build --projects=server-api --configuration production
RUN npx nx run-many --target=build --projects=react-ui 

# Install backend production dependencies
RUN cd dist/packages/server/api && npm install --production --force

### STAGE 2: Run ###
FROM base AS run

# Set up backend
WORKDIR /usr/src/app

COPY packages/server/api/src/assets/default.cf /usr/local/etc/isolate

# Install Nginx and gettext for envsubst
RUN apt-get update && apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY nginx.react.conf /etc/nginx/nginx.conf

COPY --from=build /usr/src/app/LICENSE .

RUN mkdir -p /usr/src/app/dist/packages/server/
RUN mkdir -p /usr/src/app/dist/packages/engine/
RUN mkdir -p /usr/src/app/dist/packages/shared/

# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/dist/packages/engine/ /usr/src/app/dist/packages/engine/
COPY --from=build /usr/src/app/dist/packages/server/ /usr/src/app/dist/packages/server/
COPY --from=build /usr/src/app/dist/packages/shared/ /usr/src/app/dist/packages/shared/

RUN cd /usr/src/app/dist/packages/server/api/ && npm install --production --force

# 
# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/packages packages
# Copy frontend files to Nginx document root directory from build stage
COPY --from=build /usr/src/app/dist/packages/react-ui /usr/share/nginx/html/

LABEL service=activepieces

# Set up entrypoint script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 80