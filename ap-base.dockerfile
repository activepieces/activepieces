FROM node:18.18.2-bullseye

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
  @tsconfig/node18@1.0.0 \
  @types/node@18.17.1 \
  typescript@4.8.4
