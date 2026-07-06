#!/bin/sh

export AP_CONTAINER_TYPE="${AP_CONTAINER_TYPE:-WORKER_AND_APP}"
export AP_PORT="${AP_PORT:-80}"
export AP_PM2_INSTANCES="${AP_PM2_INSTANCES:-1}"

echo "AP_CONTAINER_TYPE: $AP_CONTAINER_TYPE"
echo "AP_PORT: $AP_PORT"
echo "AP_PM2_INSTANCES: $AP_PM2_INSTANCES"

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
    if [ "$AP_PM2_INSTANCES" -gt 1 ] 2>/dev/null; then
        APP_INSTANCES=$AP_PM2_INSTANCES
        APP_EXEC_MODE="cluster"
    else
        APP_INSTANCES=1
        APP_EXEC_MODE="fork"
    fi
    APPS="${APPS}
    {
        name: 'activepieces-app',
        script: 'packages/server/api/dist/src/bootstrap.js',
        node_args: '--enable-source-maps',
        instances: ${APP_INSTANCES},
        exec_mode: '${APP_EXEC_MODE}',
        env: { AP_CONTAINER_TYPE: 'APP' }
    },"
fi

if [ "$AP_CONTAINER_TYPE" = "WORKER" ] || [ "$AP_CONTAINER_TYPE" = "WORKER_AND_APP" ]; then
    APPS="${APPS}
    {
        name: 'activepieces-worker',
        script: 'packages/server/worker/dist/src/bootstrap.js',
        node_args: '--enable-source-maps',
        instances: 1,
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
