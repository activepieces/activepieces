#!/usr/bin/env bash
set -euo pipefail

# Local benchmark runner (mirrors what .github/workflows/benchmark.yml does per matrix cell).
# Usage: ./benchmark/run-local.sh [execution_mode] [total_requests]
#   execution_mode: SANDBOXED | SANDBOX_CODE_ONLY | SANDBOX_CODE_AND_PROCESS (default: SANDBOX_CODE_AND_PROCESS)
#   total_requests: number of requests for the CLI (default: 500)

EXECUTION_MODE=${1:-SANDBOX_CODE_AND_PROCESS}
TOTAL_REQUESTS=${2:-500}
APP_REPLICAS=${APP_REPLICAS:-1}
WORKER_REPLICAS=${WORKER_REPLICAS:-2}

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

echo "=== Setting up flow + API key ==="
FLOW_ID=$(FLOW_ENABLE_TIMEOUT=$FLOW_ENABLE_TIMEOUT benchmark/setup.sh)
PROJECT_ID=$(cat /tmp/bench-project-id)
AP_API_KEY=$(cat /tmp/bench-api-key)
export AP_API_KEY
echo "Flow ID: $FLOW_ID  Project ID: $PROJECT_ID"

echo "=== Benchmark ($TOTAL_REQUESTS requests, $WORKER_REPLICAS concurrency) ==="
set +e
bun run packages/cli/src/benchmark-only.ts \
  --url http://localhost:8080 \
  --requests "$TOTAL_REQUESTS" \
  --concurrency "$WORKER_REPLICAS" \
  --project-id "$PROJECT_ID" \
  --flow-id "$FLOW_ID" \
  --json > /tmp/report.json
RC=$?
set -e

echo "=== Summary ==="
jq '.runs[0].summary, .runs[0].timeline' /tmp/report.json 2>/dev/null || echo "(no valid report at /tmp/report.json)"
echo "Full report saved to /tmp/report.json"
exit $RC
