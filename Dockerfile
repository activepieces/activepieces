### STAGE 1: Build ###
FROM activepieces/ap-base:3 AS build

# Set up backend
WORKDIR /usr/src/app
COPY . .

# Install backend dependencies and build the projects
RUN npm ci
RUN npx nx run-many --target=build --projects=backend,ui-core --skip-nx-cache

# Install backend production dependencies
RUN cd dist/packages/backend && \
    npm install --production

### STAGE 2: Run ###
FROM activepieces/ap-base:3 AS run

# Install Nginx and gettext for envsubst
RUN apt-get update && \
    apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY packages/ui/core/nginx.conf /etc/nginx/nginx.conf

# Copy frontend files to Nginx document root directory from build stage
COPY --from=build /usr/src/app/dist/packages/ui/core/ /usr/share/nginx/html/

# Copy backend files to appropriate directory from build stage
COPY --from=build /usr/src/app/dist/packages/backend/ /usr/src/app/dist/packages/backend/

# Set up entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 3000
