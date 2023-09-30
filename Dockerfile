### STAGE 1: Build ###
FROM activepieces/ap-base:7 AS build

# Set up backend
WORKDIR /usr/src/app
COPY . .

RUN apt update && apt install -y cmake libopenblas-dev patchelf

# Install Node.js dependencies
RUN npm ci

# Build the projects
RUN npx nx run-many --target=build --projects=backend,ui-core --skip-nx-cache

# Install backend production dependencies
RUN cd dist/packages/backend && \
    npm install --production --legacy-peer-deps

### STAGE 2: Run ###
FROM activepieces/ap-base:7 AS run

# Set up backend
WORKDIR /usr/src/app

# Install Nginx and gettext for envsubst
RUN apt-get update && \
    apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY packages/ui/core/nginx.conf /etc/nginx/nginx.conf

# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/dist/ /usr/src/app/dist/
COPY --from=build /usr/src/app/packages/ /usr/src/app/packages/

# Copy frontend files to Nginx document root directory
COPY --from=build /usr/src/app/dist/packages/ui/core/ /usr/share/nginx/html/

# Set up entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80
