FROM activepieces/ap-base:3

# Install Nginx and gettext for envsubst
RUN apt-get update && \
    apt-get install -y nginx

# Copy Nginx configuration template
COPY packages/ui/core/nginx.conf /etc/nginx/nginx.conf

# Set up backend
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN npx nx run-many --target=build --projects=backend,frontend

# Copy frontend files to Nginx document root directory
RUN cp -r /usr/src/app/dist/packages/frontend/* /usr/share/nginx/html

# Set up entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 3000
