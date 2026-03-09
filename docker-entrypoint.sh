#!/bin/sh

export AP_CONTAINER_TYPE="${AP_CONTAINER_TYPE:-WORKER_AND_APP}"
export AP_WORKERS="${AP_WORKERS:-1}"

echo "AP_CONTAINER_TYPE: $AP_CONTAINER_TYPE"
echo "AP_WORKERS: $AP_WORKERS"

# Start Nginx for modes that serve frontend
if [ "$AP_CONTAINER_TYPE" != "WORKER" ]; then
    nginx -g "daemon off;" &
    echo "Nginx started"
fi

# For WORKER_AND_APP, default API URL to localhost
if [ "$AP_CONTAINER_TYPE" = "WORKER_AND_APP" ]; then
    export AP_API_URL="${AP_API_URL:-http://localhost:3000}"
fi

# Auto-generate worker token if not set and JWT secret is available
if [ -z "$AP_WORKER_TOKEN" ] && [ -n "$AP_JWT_SECRET" ]; then
    echo "Auto-generating AP_WORKER_TOKEN..."
    export AP_WORKER_TOKEN=$(node -e "
        const jwt = require('jsonwebtoken');
        const crypto = require('crypto');
        const token = jwt.sign(
            { id: crypto.randomUUID(), type: 'WORKER' },
            process.env.AP_JWT_SECRET,
            { expiresIn: '100y', keyid: '1', algorithm: 'HS256', issuer: 'activepieces' }
        );
        process.stdout.write(token);
    ")
fi

# Build PM2 ecosystem config
APPS=""

if [ "$AP_CONTAINER_TYPE" = "APP" ] || [ "$AP_CONTAINER_TYPE" = "WORKER_AND_APP" ]; then
    APPS="${APPS}
    {
        name: 'activepieces-app',
        script: 'packages/server/api/dist/src/bootstrap.js',
        node_args: '--enable-source-maps',
        instances: 1,
        exec_mode: 'fork',
        env: { AP_CONTAINER_TYPE: 'APP' }
    },"
fi

if [ "$AP_CONTAINER_TYPE" = "WORKER" ] || [ "$AP_CONTAINER_TYPE" = "WORKER_AND_APP" ]; then
    APPS="${APPS}
    {
        name: 'activepieces-worker',
        script: 'packages/server/worker/dist/src/bootstrap.js',
        node_args: '--enable-source-maps',
        instances: ${AP_WORKERS},
        exec_mode: 'fork'
    },"
fi

cat > /tmp/ecosystem.config.js << ENDOFFILE
module.exports = {
    apps: [${APPS}
    ]
};
ENDOFFILE

echo "Starting Activepieces with PM2 (${AP_CONTAINER_TYPE} mode)"
pm2-runtime start /tmp/ecosystem.config.js
