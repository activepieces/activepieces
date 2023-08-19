FROM node:18.16.1-bullseye-slim

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
  pnpm@7.28.0

RUN pnpm store add \
  @tsconfig/node18@1.0.1 \
  ts-loader@9.4.2 \
  typescript@4.8.4 \
  webpack@5.74.0 \
  webpack-cli@4.10.0
