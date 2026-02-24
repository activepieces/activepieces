#!/bin/sh

# Set default values if not provided
export AP_APP_TITLE="${AP_APP_TITLE:-Activepieces}"
export AP_FAVICON_URL="${AP_FAVICON_URL:-https://cdn.activepieces.com/brand/favicon.ico}"

# Debug: Print environment variables
echo "AP_APP_TITLE: $AP_APP_TITLE"
echo "AP_FAVICON_URL: $AP_FAVICON_URL"

# Process environment variables in index.html BEFORE starting services
envsubst '${AP_APP_TITLE} ${AP_FAVICON_URL}' < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.html.tmp && \
mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html


# Start Nginx server
nginx -g "daemon off;" &

# Start backend server
if [ "$AP_CONTAINER_TYPE" = "APP" ] && [ "$AP_PM2_ENABLED" = "true" ]; then
    echo "Starting backend server with PM2 (APP mode)"
    pm2-runtime start packages/server/api/src/bootstrap.ts --interpreter tsx --name "activepieces-app" --node-args="--enable-source-maps --tsconfig packages/server/api/tsconfig.app.json" -i 0
else
    echo "Starting backend server with Node.js (WORKER mode or default)"
    tsx --enable-source-maps --tsconfig packages/server/api/tsconfig.app.json packages/server/api/src/bootstrap.ts
fi