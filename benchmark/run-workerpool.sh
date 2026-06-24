#!/usr/bin/env bash
set -euo pipefail

# Benchmark the "worker is the sandbox" model (ADR 0003): N worker replicas, each 0.5 CPU / 1 GB,
# concurrency 1, SANDBOX_CODE_ONLY, REUSE_SANDBOX=false, cache wiped after every run. Reports:
#   - COLD BOOT latency: the first request after the stack is up (cold process + cold cache).
#   - WARM THROUGHPUT: sustained req/s once the worker processes are warm (cache still wiped per run).
#
# Usage: benchmark/run-workerpool.sh [total_requests]
#   WORKER_REPLICAS (default 5)   WORKER_IMAGE (default ap-worker:local; set to
#   activepieces-benchmark:local to benchmark the all-in-one image instead)

TOTAL_REQUESTS=${1:-500}
WORKER_REPLICAS=${WORKER_REPLICAS:-5}
WORKER_IMAGE=${WORKER_IMAGE:-ap-worker:local}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose --compatibility -f $ROOT/benchmark/docker-compose.yml -f $ROOT/benchmark/docker-compose.workerpool.yml"

cleanup() { echo "Tearing down..."; $COMPOSE down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "=== Building images ==="
# Reuse an existing all-in-one app image (its build needs network for redis-memory-server). Force a
# rebuild with REBUILD_APP=1.
if [ "${REBUILD_APP:-0}" = "1" ] || ! docker image inspect activepieces-benchmark:local >/dev/null 2>&1; then
  docker build -t activepieces-benchmark:local "$ROOT"
else
  echo "Reusing existing activepieces-benchmark:local (set REBUILD_APP=1 to rebuild)"
fi
if [ "$WORKER_IMAGE" = "ap-worker:local" ]; then
  docker build -f "$ROOT/Dockerfile.worker" -t ap-worker:local "$ROOT"
fi

# The minimal worker image has no entrypoint to auto-generate the worker token, so mint it here
# (signed with the same AP_JWT_SECRET the app validates with) and inject it.
export AP_WORKER_TOKEN=$(node -e "const jwt=require('jsonwebtoken'),crypto=require('crypto');process.stdout.write(jwt.sign({id:crypto.randomUUID(),type:'WORKER'},'benchmark-secret-key-for-testing',{expiresIn:'100y',keyid:'1',algorithm:'HS256',issuer:'activepieces'}))")

echo "=== Starting stack ($WORKER_REPLICAS workers @ 0.5 CPU / 1 GB, concurrency 1) ==="
WORKER_REPLICAS=$WORKER_REPLICAS WORKER_IMAGE=$WORKER_IMAGE AP_WORKER_TOKEN=$AP_WORKER_TOKEN AP_EXECUTION_MODE=SANDBOX_CODE_ONLY $COMPOSE up -d
echo "Waiting for the stack to settle..."
sleep 8
$COMPOSE ps

echo "=== Setting up flow ==="
FLOW_ID=$(FLOW_ENABLE_TIMEOUT=30 "$ROOT/benchmark/setup.sh")
echo "Flow ID: $FLOW_ID"
WEBHOOK="http://localhost:8080/api/v1/webhooks/$FLOW_ID/sync"

echo "=== COLD BOOT: first request (cold process + cold cache) ==="
COLD_MS=$(curl -s -o /dev/null -w '%{time_total}' -m 120 \
  -X POST -H 'Content-Type: application/json' -d '{"test":true}' "$WEBHOOK" \
  | awk '{printf "%.0f", $1 * 1000}')
echo "Cold boot latency: ${COLD_MS} ms"

echo "=== WARM THROUGHPUT: $TOTAL_REQUESTS requests @ concurrency $WORKER_REPLICAS ==="
hey -n "$TOTAL_REQUESTS" -c "$WORKER_REPLICAS" -t 120 \
    -m POST -H 'Content-Type: application/json' -d '{"test":true}' \
    "$WEBHOOK" | tee /tmp/hey-workerpool.txt

echo ""
echo "=== SUMMARY ==="
echo "Model: worker-is-the-sandbox | replicas=$WORKER_REPLICAS @ 0.5cpu/1G | concurrency=1 | REUSE_SANDBOX=false | clean-cache=true | SANDBOX_CODE_ONLY"
echo "Cold boot latency : ${COLD_MS} ms"
echo -n "Warm throughput   : "; awk '/Requests\/sec/{print $2" req/s"}' /tmp/hey-workerpool.txt
awk '/Total:|Average:|Slowest:|Fastest:/{print "  "$0}' /tmp/hey-workerpool.txt
