#!/usr/bin/env bash
# Stops a container while it is running a flow and checks the flow still finishes, once.
#   SERVICE=worker          stops the worker container (AP_CONTAINER_TYPE=WORKER)
#   SERVICE=app             stops the app container, for a stack started with AP_CONTAINER_TYPE=WORKER_AND_APP
# The code step runs for RUN_SECONDS (default 60, past the old fixed 25-30 s drain); the container
# is stopped a few seconds into it.
set -euo pipefail

BASE_URL="${1:-localhost:8080}"
API_URL="http://$BASE_URL/api/v1"
SERVICE="${SERVICE:-worker}"
COMPOSE_FILE="${COMPOSE_FILE:-benchmark/docker-compose.yml}"
RUN_SECONDS="${RUN_SECONDS:-60}"
STOP_AFTER_SECONDS=5
DOCKER_STOP_TIMEOUT=180

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

sign_in() {
  local RESPONSE
  RESPONSE=$(curl -s --fail-with-body "$API_URL/authentication/sign-in" \
    -H "Content-Type: application/json" \
    -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')
  TOKEN=$(echo "$RESPONSE" | jq -r '.token')
  PROJECT_ID=$(echo "$RESPONSE" | jq -r '.projectId')
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "FAIL: Could not sign in"
    exit 1
  fi
  AUTH="Authorization: Bearer $TOKEN"
}

latest_run() {
  curl -s "$API_URL/flow-runs?flowId=$FLOW_ID&projectId=$PROJECT_ID&limit=1" -H "$AUTH" 2>/dev/null || echo '{}'
}

wait_for_api() {
  for i in $(seq 1 180); do
    if curl -sf "$API_URL/flags" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "FAIL: API did not come back within 180s"
  exit 1
}

echo "=== Graceful Stop Smoke Test (stopping: $SERVICE) ==="
sign_in
echo "Signed in. Project: $PROJECT_ID"

WEBHOOK_VERSION=""
for i in $(seq 1 300); do
  WEBHOOK_VERSION=$(curl -sf "$API_URL/pieces" -H "$AUTH" 2>/dev/null \
    | jq -r '[.[] | select(.name == "@activepieces/piece-webhook") | .version][0] // empty' 2>/dev/null || true)
  [ -n "$WEBHOOK_VERSION" ] && break
  sleep 1
done
if [ -z "$WEBHOOK_VERSION" ]; then
  echo "FAIL: Webhook piece not available after 300s"
  exit 1
fi

echo "--- Creating a flow whose code step runs for ${RUN_SECONDS}s ---"
FLOW_ID=$(curl -s --fail-with-body "$API_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Graceful Stop Smoke Test\",\"projectId\":\"$PROJECT_ID\"}" | jq -r '.id')

CODE="export const code = async () => { const startedAt = Date.now(); await new Promise((r) => setTimeout(r, ${RUN_SECONDS}000)); return { startedAt, finishedAt: Date.now() }; }"
jq -n --arg code "$CODE" --arg webhookVersion "$WEBHOOK_VERSION" '{
  type: "IMPORT_FLOW",
  request: {
    displayName: "Graceful Stop Smoke Test",
    schemaVersion: "17",
    notes: [],
    trigger: {
      name: "trigger", valid: true, displayName: "Catch Webhook", type: "PIECE_TRIGGER",
      settings: {
        pieceName: "@activepieces/piece-webhook", pieceVersion: $webhookVersion, triggerName: "catch_webhook",
        input: { authType: "none", authFields: {} },
        propertySettings: { authType: { type: "MANUAL" }, authFields: { type: "MANUAL", schema: {} } },
        sampleData: {}
      },
      nextAction: {
        name: "step_1", skip: false, type: "CODE", valid: true, displayName: "Long Step",
        settings: {
          input: {}, sampleData: {},
          sourceCode: { code: $code, packageJson: "{}" },
          errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } }
        }
      }
    }
  }
}' | curl -s --fail-with-body "$API_URL/flows/$FLOW_ID" -H "Content-Type: application/json" -H "$AUTH" -d @- > /dev/null

curl -s --fail-with-body "$API_URL/flows/$FLOW_ID" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"LOCK_AND_PUBLISH","request":{}}' > /dev/null
curl -s --fail-with-body "$API_URL/flows/$FLOW_ID" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"CHANGE_STATUS","request":{"status":"ENABLED"}}' > /dev/null
for i in $(seq 1 30); do
  [ "$(curl -s "$API_URL/flows/$FLOW_ID" -H "$AUTH" | jq -r '.status')" = "ENABLED" ] && break
  if [ "$i" -eq 30 ]; then
    echo "FAIL: Flow not ENABLED after 30s"
    exit 1
  fi
  sleep 1
done

echo "--- Triggering the flow ---"
TRIGGER_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST \
  -H "Content-Type: application/json" -d '{}' "http://$BASE_URL/api/v1/webhooks/$FLOW_ID")
if [ "$TRIGGER_CODE" != "200" ]; then
  echo "FAIL: Webhook trigger returned HTTP $TRIGGER_CODE"
  exit 1
fi

for i in $(seq 1 120); do
  STATUS=$(latest_run | jq -r '.data[0].status // empty')
  [ "$STATUS" = "RUNNING" ] && break
  if [ "$i" -eq 120 ]; then
    echo "FAIL: Run did not start within 120s (status: ${STATUS:-none})"
    exit 1
  fi
  sleep 1
done
RUN_ID=$(latest_run | jq -r '.data[0].id')
echo "Run $RUN_ID is RUNNING"
sleep "$STOP_AFTER_SECONDS"

echo "--- Stopping $SERVICE mid-run ---"
CONTAINERS=$(compose ps -q "$SERVICE")
STOP_STARTED_MS=$(date +%s%3N)
compose stop -t "$DOCKER_STOP_TIMEOUT" "$SERVICE"
STOP_SECONDS=$(( ($(date +%s%3N) - STOP_STARTED_MS) / 1000 ))
echo "$SERVICE stopped after ${STOP_SECONDS}s"

for CONTAINER in $CONTAINERS; do
  EXIT_CODE=$(docker inspect -f '{{.State.ExitCode}}' "$CONTAINER")
  if [ "$EXIT_CODE" != "0" ]; then
    echo "FAIL: $SERVICE container exited with code $EXIT_CODE (137 means Docker killed it)"
    exit 1
  fi
done

MIN_STOP_SECONDS=$(( RUN_SECONDS - STOP_AFTER_SECONDS - 10 ))
if [ "$STOP_SECONDS" -lt "$MIN_STOP_SECONDS" ]; then
  echo "FAIL: $SERVICE stopped after ${STOP_SECONDS}s, before the run could have finished (expected >= ${MIN_STOP_SECONDS}s)"
  exit 1
fi

if [ "$SERVICE" = "app" ]; then
  compose start app
  wait_for_api
  sign_in
fi

RUN=$(curl -s "$API_URL/flow-runs/$RUN_ID" -H "$AUTH")
STATUS=$(echo "$RUN" | jq -r '.status')
if [ "$STATUS" != "SUCCEEDED" ]; then
  echo "FAIL: Run ended $STATUS, expected SUCCEEDED"
  exit 1
fi

STARTED_AT=$(echo "$RUN" | jq -r '.steps.step_1.output.startedAt // empty')
if [ -z "$STARTED_AT" ]; then
  echo "FAIL: Could not read the code step's output"
  exit 1
fi
if [ "$STARTED_AT" -ge "$STOP_STARTED_MS" ]; then
  echo "FAIL: The code step started after the stop, so the run was restarted instead of finished"
  exit 1
fi

if [ "$SERVICE" = "worker" ]; then
  compose start worker
fi

echo ""
echo "=== Graceful Stop Smoke Test PASSED: run finished SUCCEEDED in place while $SERVICE stopped (${STOP_SECONDS}s) ==="
