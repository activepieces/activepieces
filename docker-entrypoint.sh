#!/bin/sh

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

export AP_CONTAINER_TYPE="${AP_CONTAINER_TYPE:-WORKER_AND_APP}"
export AP_PORT="${AP_PORT:-80}"

echo "AP_CONTAINER_TYPE: $AP_CONTAINER_TYPE"
echo "AP_PORT: $AP_PORT"

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

APP_SCRIPT="packages/server/api/dist/src/bootstrap.js"
WORKER_SCRIPT="packages/server/worker/dist/src/bootstrap.js"

echo "Starting Activepieces (${AP_CONTAINER_TYPE} mode)"

case "$AP_CONTAINER_TYPE" in
    APP)
        exec node --enable-source-maps "$APP_SCRIPT"
        ;;
    WORKER)
        exec node --enable-source-maps "$WORKER_SCRIPT"
        ;;
    WORKER_AND_APP)
        AP_CONTAINER_TYPE=APP node --enable-source-maps "$APP_SCRIPT" &
        app_pid=$!
        node --enable-source-maps "$WORKER_SCRIPT" &
        worker_pid=$!

        # Stop the worker first and keep the app up until it exits: the worker finishes its
        # running flows and reports them to the app before the app goes down.
        stop_worker_then_app() {
            kill -TERM "$worker_pid" 2>/dev/null
            wait "$worker_pid" 2>/dev/null
            kill -TERM "$app_pid" 2>/dev/null
            wait "$app_pid" 2>/dev/null
            exit 0
        }
        trap stop_worker_then_app TERM INT

        while kill -0 "$app_pid" 2>/dev/null && kill -0 "$worker_pid" 2>/dev/null; do
            sleep 1
        done

        kill "$app_pid" "$worker_pid" 2>/dev/null
        exit 1
        ;;
    *)
        echo "Unknown AP_CONTAINER_TYPE: $AP_CONTAINER_TYPE" >&2
        exit 1
        ;;
esac
