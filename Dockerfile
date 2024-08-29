FROM node:18.19-bullseye-slim AS base


RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        openssh-client \
        python3 \
        g++ \
        build-essential \
        git && \
    yarn config set python /usr/bin/python3 && \
    npm install -g node-gyp

RUN npm i -g \
  npm@9.3.1 

# Set up backend
WORKDIR /usr/src/app
COPY . .

COPY .npmrc package.json package-lock.json ./
RUN npm ci

RUN npx nx run-many --target=build --projects=server-api --configuration production --skip-nx-cache
RUN npx nx build react-ui --mode cloud --skip-nx-cache


### STAGE 2: Run ###
FROM node:18.19-bullseye-slim AS run

# Set up backend
WORKDIR /usr/src/app

# Install Nginx and gettext for envsubst
RUN apt-get update && apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY nginx.react.conf /etc/nginx/nginx.conf

COPY --from=base /usr/src/app/LICENSE .

# Copy Output files to appropriate directory from build stage
COPY --from=base /usr/src/app/packages packages

# Copy frontend files to Nginx document root directory from build stage
COPY --from=base /usr/src/app/dist/packages/react-ui /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80