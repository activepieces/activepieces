#!/usr/bin/env bash
set -euo pipefail

# Verifies that a code step that exhausts its memory limit fails the step and leaves the engine
# alive. Expects a flow created by benchmark/setup.ts with CODE_BODY_FILE=benchmark/oom-code.js
# on a stack running AP_EXECUTION_MODE=SANDBOX_CODE_ONLY. Code steps run in a Deno process capped
# at 128MB of heap; the step fills it, V8 aborts that Deno process with "Fatal JavaScript out of
# memory", and the engine reports the run as FAILED with that message on the code step.

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

# Sign in with the fixed benchmark credentials created by benchmark/setup.ts
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

latest_run() {
  list_runs | jq -r '.data[0] | "\(.id // "") \(.status // "")"'
}

code_step_error() {
  curl -s --max-time 30 "$API/flow-runs/$1" -H "$AUTH" | jq -r '.steps.step_2.errorMessage // empty'
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

  RUN_ID=""
  STATUS=""
  for _ in $(seq 1 "$RUN_TIMEOUT_SECONDS"); do
    CURRENT_COUNT=$(count_runs)
    if [ "$CURRENT_COUNT" -ge "$EXPECTED_COUNT" ]; then
      read -r RUN_ID STATUS <<< "$(latest_run)"
      case "$STATUS" in
        RUNNING|QUEUED|PAUSED|"") ;;
        *) break ;;
      esac
    fi
    sleep 1
  done

  STEP_ERROR=""
  if [ "$STATUS" = "FAILED" ]; then
    STEP_ERROR=$(code_step_error "$RUN_ID")
  fi

  if [ "$STATUS" != "FAILED" ]; then
    echo "  FAIL: run ended with status '${STATUS:-<never finished>}' (expected FAILED)"
    FAIL=$((FAIL + 1))
  elif [[ "${STEP_ERROR,,}" == *"out of memory"* ]]; then
    echo "  PASS: code step failed with an out-of-memory error"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: run FAILED, but the code step error does not say out of memory:"
    echo "${STEP_ERROR:0:2000}"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

echo "=== Results: $PASS passed, $FAIL failed out of $NUM_RUNS ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
