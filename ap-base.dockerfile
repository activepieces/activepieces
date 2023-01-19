FROM node:18.13.0-bullseye

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

RUN npm i -g --unsafe-perm \
  npm@9.3.1 \
  webpack@5.74.0 \
  webpack-cli@4.10.0 \
  webpack-node-externals@3.0.0

COPY packages/backend/src/assets/default.cf /usr/local/etc/isolate
