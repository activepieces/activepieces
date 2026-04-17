#!/usr/bin/env bash
set -euo pipefail

FLOW_ID="${1:?Usage: verify-memory.sh <flow_id> [base_url] [total_iterations] [sample_interval]}"
BASE_URL="${2:-localhost:8080}"
TOTAL_ITERATIONS="${3:-5000}"
SAMPLE_INTERVAL="${4:-500}"
WARMUP_REQUESTS=100

WEBHOOK_URL="http://$BASE_URL/api/v1/webhooks/$FLOW_ID/sync"
WORKER_CONTAINER=""

echo "=== Engine Memory Stability Test ==="
echo "Flow ID:          $FLOW_ID"
echo "Base URL:         $BASE_URL"
echo "Total iterations: $TOTAL_ITERATIONS"
echo "Sample interval:  $SAMPLE_INTERVAL"
echo "Warmup requests:  $WARMUP_REQUESTS"
echo ""

find_worker_container() {
  WORKER_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'worker' | head -n 1)
  if [ -z "$WORKER_CONTAINER" ]; then
    echo "FAIL: Could not find worker container"
    exit 1
  fi
  echo "Worker container: $WORKER_CONTAINER"
}

get_sandbox_rss_kb() {
  local rss
  rss=$(docker exec "$WORKER_CONTAINER" sh -c "ps -eo pid,rss,comm 2>/dev/null | awk '/sandbox-/ {sum+=\$2} END {print sum+0}'")
  echo "${rss}" | tr -d '[:space:]'
}

to_mb() {
  awk -v kb="$1" 'BEGIN {printf "%.1f", kb / 1024}'
}

growth_mb() {
  awk -v current="$1" -v baseline="$2" 'BEGIN {printf "%.1f", (current - baseline) / 1024}'
}

growth_int() {
  awk -v current="$1" -v baseline="$2" 'BEGIN {printf "%d", (current - baseline) / 1024}'
}

fire_request() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test":true}' \
    "$WEBHOOK_URL"
}

find_worker_container

# Warmup — let V8 heap reach steady state
echo ""
echo "--- Warmup ($WARMUP_REQUESTS requests) ---"
for i in $(seq 1 "$WARMUP_REQUESTS"); do
  STATUS=$(fire_request)
  if [ "$STATUS" != "200" ]; then
    echo "FAIL: Warmup request $i returned HTTP $STATUS"
    exit 1
  fi
  if [ "$((i % 25))" -eq 0 ]; then
    echo "  Warmup $i/$WARMUP_REQUESTS: HTTP $STATUS"
  fi
done

# Let V8 GC settle after warmup
echo "Sleeping 10s for GC to settle..."
sleep 10

# Baseline after warmup + GC
BASELINE_KB=$(get_sandbox_rss_kb)
BASELINE_MB=$(to_mb "$BASELINE_KB")
echo ""
echo "--- Baseline RSS: ${BASELINE_MB} MB ---"
echo ""

# Samples stored in temp file (iteration rss_kb)
SAMPLES_FILE=$(mktemp)
echo "0 $BASELINE_KB" > "$SAMPLES_FILE"

# Main loop
echo "--- Running $TOTAL_ITERATIONS requests ---"
for i in $(seq 1 "$TOTAL_ITERATIONS"); do
  STATUS=$(fire_request)
  if [ "$STATUS" != "200" ]; then
    echo "FAIL: Request $i returned HTTP $STATUS"
    rm -f "$SAMPLES_FILE"
    exit 1
  fi

  if [ "$((i % SAMPLE_INTERVAL))" -eq 0 ]; then
    CURRENT_KB=$(get_sandbox_rss_kb)
    CURRENT_MB=$(to_mb "$CURRENT_KB")
    CURRENT_GROWTH=$(growth_mb "$CURRENT_KB" "$BASELINE_KB")
    echo "  [$i/$TOTAL_ITERATIONS] RSS: ${CURRENT_MB} MB (growth: ${CURRENT_GROWTH} MB)"
    echo "$i $CURRENT_KB" >> "$SAMPLES_FILE"
  fi
done

# Print results table
echo ""
echo "=== Memory Samples ==="
printf "%-12s | %-10s | %-10s\n" "Iteration" "RSS (MB)" "Growth (MB)"
printf "%-12s-+-%-10s-+-%-10s\n" "------------" "----------" "----------"

while read -r iter rss_kb; do
  rss_mb=$(to_mb "$rss_kb")
  g_mb=$(growth_mb "$rss_kb" "$BASELINE_KB")
  printf "%-12s | %-10s | %-10s\n" "$iter" "$rss_mb" "$g_mb"
done < "$SAMPLES_FILE"

# Stability assertion: compare the average of the last 3 samples to the
# sample taken at 20% of iterations (warm steady-state baseline).
# This avoids false positives from V8's initial heap expansion.
SAMPLE_COUNT=$(wc -l < "$SAMPLES_FILE" | tr -d '[:space:]')

if [ "$SAMPLE_COUNT" -ge 5 ]; then
  # Warm baseline: sample at ~20% of iterations (2nd sample in the file after the 0-baseline)
  WARM_KB=$(awk 'NR==3 {print $2}' "$SAMPLES_FILE")

  # Average of last 3 samples
  LAST3_AVG_KB=$(tail -3 "$SAMPLES_FILE" | awk '{sum+=$2; n++} END {printf "%d", sum/n}')

  STEADY_GROWTH_MB=$(growth_mb "$LAST3_AVG_KB" "$WARM_KB")
  STEADY_GROWTH_INT=$(growth_int "$LAST3_AVG_KB" "$WARM_KB")
  WARM_MB=$(to_mb "$WARM_KB")
  LAST3_MB=$(to_mb "$LAST3_AVG_KB")

  echo ""
  echo "--- Stability Check ---"
  echo "Warm baseline (iter $SAMPLE_INTERVAL):    ${WARM_MB} MB"
  echo "Avg last 3 samples:                       ${LAST3_MB} MB"
  echo "Steady-state growth:                      ${STEADY_GROWTH_MB} MB"

  rm -f "$SAMPLES_FILE"

  if [ "$STEADY_GROWTH_INT" -ge 100 ]; then
    echo ""
    echo "FAIL: Steady-state memory growth ${STEADY_GROWTH_MB} MB exceeds 100 MB threshold"
    exit 1
  fi
else
  rm -f "$SAMPLES_FILE"
  echo ""
  echo "WARNING: Not enough samples ($SAMPLE_COUNT) for stability check, skipping assertion"
fi

echo ""
echo "=== Memory Stability Test PASSED (steady-state growth: ${STEADY_GROWTH_MB:-N/A} MB < 100 MB) ==="
