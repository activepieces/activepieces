#!/usr/bin/env bash
# Smoke test for feature/concurrent-pools-promote-on-release.
#
# Spins up the benchmark Docker stack with the project rate-limiter enabled and a
# concurrent jobs limit of 10, fires TOTAL async webhook calls at a flow, then
# asserts:
#   1. RUNNING flow runs never exceed the configured limit (concurrency check).
#   2. All TOTAL runs eventually reach SUCCEEDED (promote-on-release works).
set -euo pipefail

TOTAL=${TOTAL:-100}
CONCURRENCY_LIMIT=${CONCURRENCY_LIMIT:-10}
FIRE_PARALLELISM=${FIRE_PARALLELISM:-25}
WORKER_REPLICAS=${WORKER_REPLICAS:-4}
APP_REPLICAS=${APP_REPLICAS:-1}
COMPLETION_TIMEOUT=${COMPLETION_TIMEOUT:-180}
SCRIPT_TIMEOUT=${SCRIPT_TIMEOUT:-900}
KEEP_STACK=${KEEP_STACK:-0}

( sleep "$SCRIPT_TIMEOUT" && echo "ERROR: SCRIPT_TIMEOUT=${SCRIPT_TIMEOUT}s exceeded — killing smoke run" >&2 && kill -TERM $$ ) &
WATCHDOG_PID=$!

BASE_URL="http://localhost:8080/api/v1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE="docker compose -f $SCRIPT_DIR/docker-compose.yml"
VIOLATIONS_FILE="/tmp/smoke-rate-limiter-violations.txt"
MONITOR_LOG="/tmp/smoke-rate-limiter-monitor.log"
EMAIL="smoke+$(date +%s)@activepieces.com"

cleanup() {
  set +e
  if [ -n "${WATCHDOG_PID:-}" ] && kill -0 "$WATCHDOG_PID" 2>/dev/null; then
    kill "$WATCHDOG_PID" 2>/dev/null || true
    wait "$WATCHDOG_PID" 2>/dev/null || true
  fi
  if [ -n "${MONITOR_PID:-}" ] && kill -0 "$MONITOR_PID" 2>/dev/null; then
    kill "$MONITOR_PID" 2>/dev/null || true
    wait "$MONITOR_PID" 2>/dev/null || true
  fi
  if [ "$KEEP_STACK" != "1" ]; then
    echo "=== Tearing down stack ==="
    $COMPOSE down -v >/dev/null 2>&1 || true
  else
    echo "=== KEEP_STACK=1, leaving stack running ==="
  fi
}
trap cleanup EXIT

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: $1 not installed" >&2; exit 1; }
}
require docker
require curl
require jq

: > "$VIOLATIONS_FILE"
: > "$MONITOR_LOG"

echo "=== Building image ==="
( cd "$REPO_ROOT" && docker build -t activepieces-benchmark:local . )

echo "=== Bringing up stack (rate-limiter ON, limit=$CONCURRENCY_LIMIT, workers=$WORKER_REPLICAS) ==="
AP_PROJECT_RATE_LIMITER_ENABLED=true \
AP_DEFAULT_CONCURRENT_JOBS_LIMIT="$CONCURRENCY_LIMIT" \
AP_EXECUTION_MODE=SANDBOX_CODE_ONLY \
APP_REPLICAS="$APP_REPLICAS" \
WORKER_REPLICAS="$WORKER_REPLICAS" \
  $COMPOSE up -d

echo "=== Waiting for app to become ready ==="
for i in $(seq 1 60); do
  if curl -sf "$BASE_URL/flags" >/dev/null 2>&1; then
    echo "App ready after ${i}s"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: app did not become ready" >&2
    exit 1
  fi
  sleep 1
done

echo "=== Waiting for webhook piece to sync ==="
for i in $(seq 1 300); do
  HAS_WEBHOOK=$(curl -sf "$BASE_URL/pieces" 2>/dev/null \
    | jq '[.[].name] | any(. == "@activepieces/piece-webhook")' 2>/dev/null || echo "false")
  if [ "$HAS_WEBHOOK" = "true" ]; then
    echo "Webhook piece available after ${i}s"
    break
  fi
  if [ "$i" -eq 300 ]; then
    echo "ERROR: webhook piece did not sync" >&2
    exit 1
  fi
  sleep 1
done

echo "=== Signing up smoke user ($EMAIL) ==="
SIGNUP_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/authentication/sign-up" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"SmokeTestPass1\",\"firstName\":\"Smoke\",\"lastName\":\"Test\",\"trackEvents\":false,\"newsLetter\":false}")
ONBOARDING_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token')
if [ -z "$ONBOARDING_TOKEN" ] || [ "$ONBOARDING_TOKEN" = "null" ]; then
  echo "ERROR: sign-up failed: $SIGNUP_RESPONSE" >&2
  exit 1
fi

echo "=== Creating platform ==="
PLATFORM_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/platforms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ONBOARDING_TOKEN" \
  -d '{"name":"Smoke Platform"}')
TOKEN=$(echo "$PLATFORM_RESPONSE" | jq -r '.token')
PROJECT_ID=$(echo "$PLATFORM_RESPONSE" | jq -r '.projectId')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "ERROR: platform creation failed: $PLATFORM_RESPONSE" >&2
  exit 1
fi
AUTH="Authorization: Bearer $TOKEN"
echo "Project: $PROJECT_ID"

echo "=== Creating flow ==="
FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Smoke Flow\",\"projectId\":\"$PROJECT_ID\"}")
FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow: $FLOW_ID"

echo "=== Importing flow definition ==="
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{
    "type": "IMPORT_FLOW",
    "request": {
      "displayName": "Smoke Flow",
      "schemaVersion": "17",
      "notes": [],
      "trigger": {
        "name": "trigger",
        "valid": true,
        "displayName": "Catch Webhook",
        "type": "PIECE_TRIGGER",
        "settings": {
          "pieceName": "@activepieces/piece-webhook",
          "pieceVersion": "~0.1.29",
          "triggerName": "catch_webhook",
          "input": { "authType": "none", "authFields": {} },
          "propertySettings": {
            "authType": { "type": "MANUAL" },
            "authFields": { "type": "MANUAL", "schema": {} },
            "liveMarkdown": { "type": "MANUAL" },
            "syncMarkdown": { "type": "MANUAL" },
            "testMarkdown": { "type": "MANUAL" }
          },
          "sampleData": {}
        },
        "nextAction": {
          "name": "step_2",
          "skip": false,
          "type": "CODE",
          "valid": true,
          "settings": {
            "input": {},
            "sampleData": {},
            "sourceCode": {
              "code": "export const code = async (inputs) => { return true; };\n",
              "packageJson": "{}"
            },
            "errorHandlingOptions": {
              "retryOnFailure": { "value": false },
              "continueOnFailure": { "value": false }
            }
          },
          "displayName": "Code"
        }
      }
    }
  }' >/dev/null

echo "=== Publishing + enabling flow ==="
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"LOCK_AND_PUBLISH","request":{}}' >/dev/null
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"CHANGE_STATUS","request":{"status":"ENABLED"}}' >/dev/null

for i in $(seq 1 60); do
  STATUS=$(curl -s "$BASE_URL/flows/$FLOW_ID" -H "$AUTH" | jq -r '.status')
  if [ "$STATUS" = "ENABLED" ]; then
    echo "Flow enabled"
    break
  fi
  sleep 1
done

echo "=== Starting concurrency monitor (limit=$CONCURRENCY_LIMIT) ==="
(
  while true; do
    COUNTS=$(curl -s "$BASE_URL/flow-runs/count-by-status?projectId=$PROJECT_ID" \
      -H "$AUTH" 2>/dev/null || echo '{"data":[]}')
    RUNNING=$(echo "$COUNTS" | jq '[.data[] | select(.status=="RUNNING") | .count] | add // 0')
    QUEUED=$(echo "$COUNTS"  | jq '[.data[] | select(.status=="QUEUED")  | .count] | add // 0')
    TS=$(date +%s)
    echo "$TS running=$RUNNING queued=$QUEUED" >> "$MONITOR_LOG"
    if [ "$RUNNING" -gt "$CONCURRENCY_LIMIT" ]; then
      echo "$TS running=$RUNNING > limit=$CONCURRENCY_LIMIT" >> "$VIOLATIONS_FILE"
    fi
    sleep 1
  done
) &
MONITOR_PID=$!

echo "=== Firing $TOTAL async webhook calls (parallelism=$FIRE_PARALLELISM) ==="
START=$(date +%s)
seq 1 "$TOTAL" | xargs -P "$FIRE_PARALLELISM" -I{} \
  curl -sS -o /dev/null -w '' -X POST \
    -H 'Content-Type: application/json' \
    -d '{"smoke":true}' \
    "$BASE_URL/webhooks/$FLOW_ID"
FIRE_END=$(date +%s)
echo "Fired $TOTAL webhooks in $((FIRE_END - START))s"

echo "=== Waiting for all $TOTAL runs to terminate (timeout=${COMPLETION_TIMEOUT}s) ==="
DEADLINE=$(( $(date +%s) + COMPLETION_TIMEOUT ))
while true; do
  COUNTS_JSON=$(curl -s --fail-with-body \
    "$BASE_URL/flow-runs/count-by-status?projectId=$PROJECT_ID" \
    -H "$AUTH" || echo '{"data":[]}')
  SUCCEEDED=$(echo "$COUNTS_JSON" | jq '[.data[] | select(.status=="SUCCEEDED") | .count] | add // 0')
  FAILED=$(echo "$COUNTS_JSON"   | jq '[.data[] | select(.status=="FAILED" or .status=="INTERNAL_ERROR" or .status=="TIMEOUT" or .status=="QUOTA_EXCEEDED" or .status=="MEMORY_LIMIT_EXCEEDED" or .status=="LOG_SIZE_EXCEEDED" or .status=="CANCELED") | .count] | add // 0')
  RUNNING=$(echo "$COUNTS_JSON"  | jq '[.data[] | select(.status=="RUNNING") | .count] | add // 0')
  QUEUED=$(echo "$COUNTS_JSON"   | jq '[.data[] | select(.status=="QUEUED") | .count] | add // 0')
  PAUSED=$(echo "$COUNTS_JSON"   | jq '[.data[] | select(.status=="PAUSED") | .count] | add // 0')
  TERMINAL=$((SUCCEEDED + FAILED))
  printf "[%4ds] succeeded=%d failed=%d running=%d queued=%d paused=%d\n" \
    "$(( $(date +%s) - START ))" "$SUCCEEDED" "$FAILED" "$RUNNING" "$QUEUED" "$PAUSED"
  if [ "$TERMINAL" -ge "$TOTAL" ]; then
    break
  fi
  if [ "$(date +%s)" -ge "$DEADLINE" ]; then
    echo "ERROR: timed out after ${COMPLETION_TIMEOUT}s with terminal=$TERMINAL/$TOTAL" >&2
    exit 2
  fi
  sleep 5
done

echo "=== Stopping concurrency monitor ==="
kill "$MONITOR_PID" 2>/dev/null || true
wait "$MONITOR_PID" 2>/dev/null || true
MONITOR_PID=""

echo "=== Results ==="
echo "Total runs:        $TOTAL"
echo "Succeeded:         $SUCCEEDED"
echo "Failed:            $FAILED"
echo "Concurrency limit: $CONCURRENCY_LIMIT"
echo "Monitor samples:   $(wc -l < "$MONITOR_LOG" | tr -d ' ')"
MAX_RUNNING=$(awk '{print $2}' "$MONITOR_LOG" | sed 's/running=//' | sort -n | tail -1)
echo "Max RUNNING seen:  ${MAX_RUNNING:-0}"

VIOLATION_COUNT=$(wc -l < "$VIOLATIONS_FILE" | tr -d ' ')
if [ "$VIOLATION_COUNT" -gt 0 ]; then
  echo "FAIL: concurrency limit exceeded $VIOLATION_COUNT times" >&2
  head -20 "$VIOLATIONS_FILE" >&2
  exit 3
fi
if [ "$SUCCEEDED" -ne "$TOTAL" ]; then
  echo "FAIL: succeeded=$SUCCEEDED, expected $TOTAL (failed=$FAILED)" >&2
  exit 4
fi

echo "PASS: $TOTAL runs SUCCEEDED, max concurrency $MAX_RUNNING <= limit $CONCURRENCY_LIMIT"
