### STAGE 1: Build ###
FROM node:18.19-bullseye-slim AS build

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 g++ build-essential && \
    yarn config set python /usr/bin/python3 && \
    npm install -g node-gyp

RUN npm i -g npm@9.3.1

# Set up backend
WORKDIR /usr/src/app
COPY . .

COPY .npmrc package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx run-many --target=build --projects=backend,ui-core --configuration production --skip-nx-cache

# Install backend production dependencies
RUN cd dist/packages/backend && npm install --production --force

### STAGE 2: Run ###
FROM node:18.19-bullseye-slim AS run

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 g++ build-essential && \
    yarn config set python /usr/bin/python3 && \
    npm install -g node-gyp

COPY packages/backend/src/assets/default.cf /usr/local/etc/isolate

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
    locales-all \
    libcap-dev \
 && rm -rf /var/lib/apt/lists/*

# Set the locale
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

RUN npm i -g \
  npm@9.3.1 \
  pnpm@7.28.0 \
  cross-env@7.0.3

# install isolated-vm in a parent directory to avoid linking the package in every sandbox
RUN cd /usr/src && npm i isolated-vm@4.6.0

RUN pnpm store add \
  @tsconfig/node18@1.0.0 \
  @types/node@18.17.1 \
  typescript@4.8.4

# Set up backend
WORKDIR /usr/src/app

# Install Nginx and gettext for envsubst
RUN apt-get update && apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY packages/ui/core/nginx.standard.conf /etc/nginx/nginx.conf

COPY --from=build /usr/src/app/LICENSE .

# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/dist dist

# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/packages packages

LABEL service=activepieces

# Copy frontend files to Nginx document root directory from build stage
COPY --from=build /usr/src/app/dist/packages/ui/core/ /usr/share/nginx/html/

# Set up entrypoint script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 80
