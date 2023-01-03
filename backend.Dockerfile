FROM node:18.12.1-bullseye

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

RUN npm install --global --unsafe-perm webpack@5.74.0
RUN npm install --global --unsafe-perm webpack-cli@^4.10.0
RUN npm install --global --unsafe-perm webpack-node-externals@^3.0.0

RUN corepack enable
RUN corepack prepare pnpm@7.21.0 --activate

COPY packages/backend/resources/default.cf /usr/local/etc/isolate

WORKDIR /usr/src/app
COPY . .

RUN pnpm install --frozen-lockfile --config.auto-install-peers=true
RUN pnpm dlx nx run-many --target=build

EXPOSE 3000

WORKDIR /usr/src/app/packages/backend

ENTRYPOINT ["/usr/local/bin/pnpm", "serve:prod"]
