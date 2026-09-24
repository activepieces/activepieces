#!/usr/bin/env bash
set -euo pipefail

# Local benchmark runner (mirrors what .github/workflows/benchmark.yml does per matrix cell).
# Two cell presets match the matrix; override with env vars if you want something custom.
#
# Usage: ./benchmark/run-local.sh [cell] [total_requests]
#   cell: shared-16cpu | dedicated-05cpu  (default: dedicated-05cpu)
#   total_requests: number of requests for the CLI (default: 500)
#
# Env overrides (any subset): EXECUTION_MODE, APP_REPLICAS, WORKER_REPLICAS,
# WORKER_CPUS, WORKER_MEMORY, WORKER_HEAP_MB, AP_WORKER_CONCURRENCY, AP_REUSE_SANDBOX.

CELL=${1:-dedicated-05cpu}
TOTAL_REQUESTS=${2:-500}

case "$CELL" in
  shared-16cpu)
    : "${APP_REPLICAS:=1}"
    : "${WORKER_REPLICAS:=1}"
    : "${WORKER_CPUS:=16}"
    : "${WORKER_MEMORY:=32G}"
    : "${WORKER_HEAP_MB:=64512}"
    : "${AP_WORKER_CONCURRENCY:=28}"
    : "${AP_REUSE_SANDBOX:=false}"
    ;;
  dedicated-05cpu)
    : "${APP_REPLICAS:=1}"
    : "${WORKER_REPLICAS:=4}"
    : "${WORKER_CPUS:=0.5}"
    : "${WORKER_MEMORY:=1G}"
    : "${WORKER_HEAP_MB:=768}"
    : "${AP_WORKER_CONCURRENCY:=1}"
    : "${AP_REUSE_SANDBOX:=true}"
    ;;
  *)
    echo "ERROR: unknown cell '$CELL' (expected: shared-16cpu | dedicated-05cpu)" >&2
    exit 2
    ;;
esac

: "${EXECUTION_MODE:=SANDBOX_PROCESS}"
: "${FLOW_ENABLE_TIMEOUT:=120}"
export APP_REPLICAS WORKER_REPLICAS WORKER_CPUS WORKER_MEMORY WORKER_HEAP_MB \
       AP_WORKER_CONCURRENCY AP_REUSE_SANDBOX AP_EXECUTION_MODE FLOW_ENABLE_TIMEOUT
export AP_EXECUTION_MODE=$EXECUTION_MODE

COMPOSE="docker compose -f $(dirname "$0")/docker-compose.yml"

cleanup() {
  echo "Tearing down..."
  $COMPOSE down -v
}
trap cleanup EXIT

echo "=== Building image ==="
docker build -t activepieces-benchmark:local .

echo "=== Starting stack (cell=$CELL mode=$EXECUTION_MODE apps=$APP_REPLICAS workers=$WORKER_REPLICAS×${WORKER_CPUS}cpu conc=$AP_WORKER_CONCURRENCY reuse=$AP_REUSE_SANDBOX) ==="
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
