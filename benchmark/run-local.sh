#!/usr/bin/env bash
set -euo pipefail

# Local benchmark runner with SANDBOXED mode support
# Usage: ./benchmark/run-local.sh [execution_mode] [total_requests]
#   execution_mode: SANDBOXED | SANDBOX_CODE_ONLY (default: SANDBOXED)
#   total_requests: number of requests for hey (default: 500)

EXECUTION_MODE=${1:-SANDBOX_CODE_AND_PROCESS}
TOTAL_REQUESTS=${2:-500}
APP_REPLICAS=${APP_REPLICAS:-1}
WORKER_REPLICAS=${WORKER_REPLICAS:-2}

# SANDBOXED mode needs more time for sandbox initialization
if [ "$EXECUTION_MODE" = "SANDBOXED" ]; then
  export FLOW_ENABLE_TIMEOUT=120
else
  export FLOW_ENABLE_TIMEOUT=30
fi

COMPOSE="docker compose -f $(dirname "$0")/docker-compose.yml"

cleanup() {
  echo "Tearing down..."
  $COMPOSE down -v
}
trap cleanup EXIT

echo "=== Building image ==="
docker build -t activepieces-benchmark:local .

echo "=== Starting stack (mode=$EXECUTION_MODE, apps=$APP_REPLICAS, workers=$WORKER_REPLICAS) ==="
AP_EXECUTION_MODE=$EXECUTION_MODE \
APP_REPLICAS=$APP_REPLICAS \
WORKER_REPLICAS=$WORKER_REPLICAS \
  $COMPOSE up -d

echo "Waiting for containers to settle..."
sleep 5
$COMPOSE ps

echo "=== Setting up flow ==="
FLOW_ID=$(FLOW_ENABLE_TIMEOUT=$FLOW_ENABLE_TIMEOUT benchmark/setup.sh)
echo "Flow ID: $FLOW_ID"

echo "=== Warmup ==="
hey -n 500 -c "$WORKER_REPLICAS" -t 60 \
    -m POST \
    -H "Content-Type: application/json" \
    -d '{"test":true}' \
    "http://localhost:8080/api/v1/webhooks/$FLOW_ID/sync" \
    | tail -5

echo "=== Benchmark ($TOTAL_REQUESTS requests, $WORKER_REPLICAS concurrency) ==="
hey -n "$TOTAL_REQUESTS" \
    -c "$WORKER_REPLICAS" \
    -t 60 \
    -m POST \
    -H "Content-Type: application/json" \
    -d '{"test":true}' \
    "http://localhost:8080/api/v1/webhooks/$FLOW_ID/sync" \
    | tee /tmp/hey-output.txt

echo "=== Parsing results ==="
benchmark/parse.sh /tmp/hey-output.txt /tmp/results.json
echo "Results saved to /tmp/results.json"
cat /tmp/results.json
