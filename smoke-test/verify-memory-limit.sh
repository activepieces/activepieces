#!/usr/bin/env bash
set -euo pipefail

# Verifies that a flow that exhausts the sandbox memory reliably ends with flow run status
# MEMORY_LIMIT_EXCEEDED. Expects a flow created by benchmark/setup.sh with
# CODE_INPUT_SUM="$(cat benchmark/oom-expression.txt)" on a stack running
# AP_EXECUTION_MODE=SANDBOX_CODE_ONLY. The expression builds ~50MB inside the 128MB v8
# isolate (an array of refs to one big string), and the engine's outRef.copy() then
# materializes every element separately in the ENGINE heap (~3GB) — the engine process dies
# on the sandbox memory limit, which is how code-only engines OOM in production.

FLOW_ID="${1:?Usage: verify-memory-limit.sh <flow_id> [base_url] [num_runs]}"
BASE_URL="${2:-localhost:8080}"
NUM_RUNS="${3:-3}"
RUN_TIMEOUT_SECONDS=180

API="http://$BASE_URL/api/v1"
BENCH_EMAIL="${BENCH_EMAIL:-bench@activepieces.com}"

echo "=== Memory Limit Exceeded Detection Test ==="
echo "Flow ID:  $FLOW_ID"
echo "Base URL: $BASE_URL"
echo "Runs:     $NUM_RUNS"
echo ""

# Sign in with the fixed benchmark credentials created by benchmark/setup.sh
SIGNIN_RESPONSE=$(curl -s "$API/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${BENCH_EMAIL}\",\"password\":\"BenchmarkPass1\"}")
TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.token // empty')
PROJECT_ID=$(echo "$SIGNIN_RESPONSE" | jq -r '.projectId // empty')

if [ -z "$TOKEN" ] || [ -z "$PROJECT_ID" ]; then
  echo "FAIL: could not sign in as $BENCH_EMAIL"
  echo "$SIGNIN_RESPONSE"
  exit 1
fi
AUTH="Authorization: Bearer $TOKEN"

list_runs() {
  curl -s --max-time 30 "$API/flow-runs?projectId=$PROJECT_ID&flowId=$FLOW_ID&limit=$((NUM_RUNS + 5))" -H "$AUTH"
}

count_runs() {
  list_runs | jq '.data | length'
}

latest_run_status() {
  list_runs | jq -r '.data[0].status // empty'
}

PASS=0
FAIL=0
BASELINE_COUNT=$(count_runs)
echo "Existing runs before test: $BASELINE_COUNT"
echo ""

for i in $(seq 1 "$NUM_RUNS"); do
  echo "--- Run $i/$NUM_RUNS ---"
  EXPECTED_COUNT=$((BASELINE_COUNT + i))

  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test":true}' \
    "http://$BASE_URL/api/v1/webhooks/$FLOW_ID")
  echo "  Webhook fired (HTTP $HTTP_CODE)"

  STATUS=""
  for _ in $(seq 1 "$RUN_TIMEOUT_SECONDS"); do
    CURRENT_COUNT=$(count_runs)
    if [ "$CURRENT_COUNT" -ge "$EXPECTED_COUNT" ]; then
      STATUS=$(latest_run_status)
      case "$STATUS" in
        RUNNING|QUEUED|PAUSED|"") ;;
        *) break ;;
      esac
    fi
    sleep 1
  done

  if [ "$STATUS" = "MEMORY_LIMIT_EXCEEDED" ]; then
    echo "  PASS: run ended with status MEMORY_LIMIT_EXCEEDED"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: run ended with status '${STATUS:-<never finished>}' (expected MEMORY_LIMIT_EXCEEDED)"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

echo "=== Results: $PASS passed, $FAIL failed out of $NUM_RUNS ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
