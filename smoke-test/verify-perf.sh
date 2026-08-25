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

# With a 2-CPU / 2G cap, throughput is the primary signal — a #13497-style regression
# drops it from ~90+ to ~15 req/s (floor 40 leaves a wide margin either way). The CPU
# and memory ceilings are generous sanity bounds: CPU catches a pegged worker (~195%+),
# memory catches a leak climbing toward the 2G cap and OOM (healthy steady-state is
# ~1.5G under this load). All three are env-overridable per runner.
MIN_RPS="${PERF_MIN_RPS:-40}"
MAX_CPU_PERCENT="${PERF_MAX_CPU_PERCENT:-192}"
MAX_MEM_MB="${PERF_MAX_MEM_MB:-1850}"

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
# MemUsage looks like "<used> / <limit>", e.g. "1.005GiB / 2GiB" or "512MiB / 2GiB".
# Parse ONLY the used value ($2) and its own unit — never match units against the
# whole line, or the limit's "GiB" would corrupt a used value in MiB/KiB.
MAX_MEM_MB_OBSERVED=$(awk '
  BEGIN { max = 0 }
  {
    used = $2
    unit = used; gsub(/[0-9.]/, "", unit)
    val = used;  gsub(/[A-Za-z]/, "", val); val = val + 0
    if (unit == "GiB") mb = val * 1024
    else if (unit == "MiB") mb = val
    else if (unit == "KiB") mb = val / 1024
    else mb = val / (1024 * 1024)
    if (mb + 0 > max + 0) max = mb
  }
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
# Without samples the CPU/memory awks emit 0, which would silently pass both
# thresholds — exactly the regression this gate must catch. Treat it as a failure.
if [ ! -s "$WORKDIR/stats.txt" ]; then
  echo "FAIL: no docker stats samples collected; cannot assert worker CPU/memory"
  FAILED=1
fi
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

echo "=== Perf Regression Preflight PASSED ==="
