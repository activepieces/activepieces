### STAGE 1: Build ###
FROM node:18.12.1-bullseye AS build

RUN corepack enable
RUN corepack prepare pnpm@7.21.0 --activate

WORKDIR /usr/src/app
COPY . .

RUN pnpm install --frozen-lockfile --config.auto-install-peers=true
RUN pnpm dlx nx run-many --target=build

### STAGE 2: Run ###
FROM nginx:1.17.1-alpine
COPY ./packages/frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/packages/frontend/_static /usr/share/nginx/html
