#!/usr/bin/env bash
set -uo pipefail

# Perf-regression preflight: drives concurrent load at a published flow and fails
# if throughput, worker CPU, or worker memory cross a threshold. Catches regressions
# like #13497 (a full process-table scan on the poll hot path) that pegged worker CPU
# and collapsed throughput ~7x (136 -> 18 req/s) without breaking any functional test.
#
# Pair with benchmark/docker-compose.perf.yml so app + worker run with fixed CPU/RAM
# (2 CPU / 2G) — that makes the thresholds below deterministic across runners.
#
# Thresholds are deliberately generous (the regressions we guard against are multi-x,
# not a few percent) and overridable via env so runner drift never makes this flaky.

FLOW_ID="${1:?Usage: verify-perf.sh <flow_id> [base_url]}"
BASE_URL="${2:-localhost:8080}"

DURATION_SECS="${PERF_DURATION_SECS:-20}"
CONCURRENCY="${PERF_CONCURRENCY:-8}"
WARMUP_REQUESTS="${PERF_WARMUP_REQUESTS:-100}"

# With a 2-CPU / 2G cap: healthy run ~100+ req/s, worker ~85% CPU, <1G RAM.
# A #13497-style regression: ~18 req/s, worker pegged ~200%, climbing RAM.
MIN_RPS="${PERF_MIN_RPS:-40}"
MAX_CPU_PERCENT="${PERF_MAX_CPU_PERCENT:-185}"
MAX_MEM_MB="${PERF_MAX_MEM_MB:-1500}"

WEBHOOK_URL="http://$BASE_URL/api/v1/webhooks/$FLOW_ID/sync"

echo "=== Perf Regression Preflight ==="
echo "Flow ID:        $FLOW_ID"
echo "Duration:       ${DURATION_SECS}s @ concurrency ${CONCURRENCY}"
echo "Thresholds:     rps >= ${MIN_RPS}, worker cpu <= ${MAX_CPU_PERCENT}%, worker mem <= ${MAX_MEM_MB} MB"
echo ""

WORKER_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'worker' | head -n 1)
if [ -z "$WORKER_CONTAINER" ]; then
  echo "FAIL: could not find worker container"
  exit 1
fi
echo "Worker container: $WORKER_CONTAINER"

fire_request() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
    -X POST -H 'Content-Type: application/json' -d '{"test":true}' "$WEBHOOK_URL"
}

echo "--- Warmup ($WARMUP_REQUESTS requests) ---"
for i in $(seq 1 "$WARMUP_REQUESTS"); do
  STATUS=$(fire_request)
  if [ "$STATUS" != "200" ]; then
    echo "FAIL: warmup request $i returned HTTP $STATUS"
    exit 1
  fi
done

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

# Sample worker CPU% and memory once per second for the whole load window.
sample_stats() {
  local deadline=$1
  while [ "$(date +%s)" -lt "$deadline" ]; do
    docker stats --no-stream --format '{{.CPUPerc}} {{.MemUsage}}' "$WORKER_CONTAINER" 2>/dev/null >> "$WORKDIR/stats.txt"
  done
}

# One load worker: fire requests back-to-back until the deadline, recording
# total + non-200 counts to its own file (no shared-counter races).
load_worker() {
  local id=$1 deadline=$2 total=0 bad=0
  while [ "$(date +%s)" -lt "$deadline" ]; do
    local status
    status=$(fire_request)
    total=$((total + 1))
    [ "$status" != "200" ] && bad=$((bad + 1))
  done
  echo "$total $bad" > "$WORKDIR/load-$id.txt"
}

START=$(date +%s)
DEADLINE=$((START + DURATION_SECS))

echo ""
echo "--- Load (${DURATION_SECS}s) ---"
sample_stats "$DEADLINE" &
STATS_PID=$!
for c in $(seq 1 "$CONCURRENCY"); do
  load_worker "$c" "$DEADLINE" &
done
wait
ELAPSED=$(( $(date +%s) - START ))
[ "$ELAPSED" -lt 1 ] && ELAPSED=1

TOTAL_REQUESTS=0
BAD_REQUESTS=0
for f in "$WORKDIR"/load-*.txt; do
  read -r t b < "$f"
  TOTAL_REQUESTS=$((TOTAL_REQUESTS + t))
  BAD_REQUESTS=$((BAD_REQUESTS + b))
done

RPS=$(awk -v n="$TOTAL_REQUESTS" -v s="$ELAPSED" 'BEGIN { printf "%.1f", n / s }')
AVG_CPU=$(awk '{ gsub(/%/,"",$1); sum += $1; n++ } END { printf "%.1f", (n ? sum / n : 0) }' "$WORKDIR/stats.txt")
MAX_MEM_MB_OBSERVED=$(awk '
  { used = $2 }
  /GiB/ { gsub(/GiB/,"",used); v = used * 1024 }
  /MiB/ { gsub(/MiB/,"",used); v = used }
  /KiB/ { gsub(/KiB/,"",used); v = used / 1024 }
  v > max { max = v }
  END { printf "%.0f", max }
' "$WORKDIR/stats.txt")

echo ""
echo "=== Results ==="
printf "%-22s %s\n" "Total requests:" "$TOTAL_REQUESTS (non-200: $BAD_REQUESTS)"
printf "%-22s %s\n" "Throughput:" "${RPS} req/s   (min ${MIN_RPS})"
printf "%-22s %s\n" "Worker CPU (avg):" "${AVG_CPU}%   (max ${MAX_CPU_PERCENT}%)"
printf "%-22s %s\n" "Worker mem (peak):" "${MAX_MEM_MB_OBSERVED} MB   (max ${MAX_MEM_MB} MB)"
echo ""

FAILED=0
if [ "$BAD_REQUESTS" -gt 0 ]; then
  echo "FAIL: $BAD_REQUESTS request(s) did not return HTTP 200"
  FAILED=1
fi
if awk -v v="$RPS" -v t="$MIN_RPS" 'BEGIN { exit !(v < t) }'; then
  echo "FAIL: throughput ${RPS} req/s below ${MIN_RPS} req/s"
  FAILED=1
fi
if awk -v v="$AVG_CPU" -v t="$MAX_CPU_PERCENT" 'BEGIN { exit !(v > t) }'; then
  echo "FAIL: worker CPU ${AVG_CPU}% above ${MAX_CPU_PERCENT}%"
  FAILED=1
fi
if awk -v v="$MAX_MEM_MB_OBSERVED" -v t="$MAX_MEM_MB" 'BEGIN { exit !(v > t) }'; then
  echo "FAIL: worker mem ${MAX_MEM_MB_OBSERVED} MB above ${MAX_MEM_MB} MB"
  FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "=== Perf Regression Preflight FAILED ==="
  exit 1
fi

STATS_PID=${STATS_PID:-}
echo "=== Perf Regression Preflight PASSED ==="
