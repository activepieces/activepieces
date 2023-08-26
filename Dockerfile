### STAGE 1: Build ###
FROM activepieces/ap-base:5 AS build

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
FROM activepieces/ap-base:5 AS run

# Set up backend
WORKDIR /usr/src/app

# Install Nginx and gettext for envsubst
RUN apt-get update && \
    apt-get install -y nginx gettext

# Copy Nginx configuration template
COPY packages/ui/core/nginx.conf /etc/nginx/nginx.conf

# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/dist/ /usr/src/app/dist/

# Copy Output files to appropriate directory from build stage
COPY --from=build /usr/src/app/packages/ /usr/src/app/packages/


# Copy frontend files to Nginx document root directory from build stage
COPY --from=build /usr/src/app/dist/packages/ui/core/ /usr/share/nginx/html/

# Set up entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80
