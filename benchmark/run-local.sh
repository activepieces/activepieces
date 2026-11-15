#!/usr/bin/env bash
set -euo pipefail

# Local benchmark runner — reproduces one nightly matrix cell on a dev machine.
# Layers docker-compose.ci.yml on top of the base file, matching CI exactly.
#
# Usage: ./benchmark/run-local.sh [cell] [total_requests]
#   cell: shared | dedicated  (default: dedicated)
#   total_requests: number of requests for the CLI (default: 500)
#
# Env overrides (any subset): EXECUTION_MODE, APP_REPLICAS, WORKER_REPLICAS,
# WORKER_CPUS, WORKER_MEMORY, WORKER_HEAP_MB, AP_WORKER_CONCURRENCY, AP_REUSE_SANDBOX.
#
# Heads-up: docker-compose.ci.yml pins app→cpuset "16-17" and worker→cpuset
# "0-15", so this needs a host with ≥18 CPUs. If you don't have that, drop
# the `-f docker-compose.ci.yml` override below (loses cpuset partitioning
# and requires setting AP_REUSE_SANDBOX explicitly elsewhere).

CELL=${1:-dedicated}
TOTAL_REQUESTS=${2:-500}

case "$CELL" in
  shared|dedicated)
    : "${APP_REPLICAS:=1}"
    : "${WORKER_REPLICAS:=28}"
    : "${WORKER_CPUS:=0.5}"
    : "${WORKER_MEMORY:=1G}"
    : "${WORKER_HEAP_MB:=768}"
    : "${AP_WORKER_CONCURRENCY:=1}"
    ;;
  *)
    echo "ERROR: unknown cell '$CELL' (expected: shared | dedicated)" >&2
    exit 2
    ;;
esac

case "$CELL" in
  shared)    : "${AP_REUSE_SANDBOX:=false}" ;;
  dedicated) : "${AP_REUSE_SANDBOX:=true}" ;;
esac

: "${EXECUTION_MODE:=SANDBOX_PROCESS}"
: "${FLOW_ENABLE_TIMEOUT:=120}"
export APP_REPLICAS WORKER_REPLICAS WORKER_CPUS WORKER_MEMORY WORKER_HEAP_MB \
       AP_WORKER_CONCURRENCY AP_REUSE_SANDBOX AP_EXECUTION_MODE FLOW_ENABLE_TIMEOUT
export AP_EXECUTION_MODE=$EXECUTION_MODE

TOTAL_SLOTS=$((WORKER_REPLICAS * AP_WORKER_CONCURRENCY))

COMPOSE="docker compose -f $(dirname "$0")/docker-compose.yml -f $(dirname "$0")/docker-compose.ci.yml"

cleanup() {
  echo "Tearing down..."
  $COMPOSE down -v
}
trap cleanup EXIT

echo "=== Building image ==="
docker build -t activepieces-benchmark:local .

echo "=== Starting stack (cell=$CELL mode=$EXECUTION_MODE apps=$APP_REPLICAS workers=$WORKER_REPLICAS×${WORKER_CPUS}cpu conc=$AP_WORKER_CONCURRENCY total_slots=$TOTAL_SLOTS reuse=$AP_REUSE_SANDBOX) ==="
$COMPOSE up -d

echo "Waiting for containers to settle..."
sleep 5
$COMPOSE ps

echo "=== Setting up flow + API key ==="
FLOW_ID=$(FLOW_ENABLE_TIMEOUT=$FLOW_ENABLE_TIMEOUT \
          BENCH_API_KEY_FILE=/tmp/bench-api-key \
          BENCH_PROJECT_ID_FILE=/tmp/bench-project-id \
          bun run benchmark/setup.ts)
PROJECT_ID=$(cat /tmp/bench-project-id)
AP_API_KEY=$(cat /tmp/bench-api-key)
export AP_API_KEY
echo "Flow ID: $FLOW_ID  Project ID: $PROJECT_ID"

echo "=== Benchmark ($TOTAL_REQUESTS requests, $TOTAL_SLOTS concurrency = $WORKER_REPLICAS workers × $AP_WORKER_CONCURRENCY slots) ==="
set +e
bun run packages/cli/src/benchmark-only.ts \
  --url http://localhost:8080 \
  --requests "$TOTAL_REQUESTS" \
  --concurrency "$TOTAL_SLOTS" \
  --project-id "$PROJECT_ID" \
  --flow-id "$FLOW_ID" \
  --json > /tmp/report.json
RC=$?
set -e

echo "=== Summary ==="
jq '.runs[0].summary, .runs[0].timeline' /tmp/report.json 2>/dev/null || echo "(no valid report at /tmp/report.json)"
echo "Full report saved to /tmp/report.json"
exit $RC
