#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-localhost:8080}"
API_URL="http://$BASE_URL/api/v1"
POLL_TIMEOUT="${2:-60}"
# PHASE=arm pauses a run and saves its flow id; PHASE=check waits for that run after an upgrade.
PHASE="${PHASE:-all}"
DELAY_SECONDS="${DELAY_SECONDS:-11}"
DELAY_FLOW_ID_FILE="${DELAY_FLOW_ID_FILE:-delay-flow-id}"

wait_for_run() {
  local TARGET="$1"
  echo "--- Waiting for flow run to reach $TARGET (timeout: ${POLL_TIMEOUT}s) ---"
  for i in $(seq 1 "$POLL_TIMEOUT"); do
    RUNS_RESPONSE=$(curl -s "$API_URL/flow-runs?flowId=$FLOW_ID&projectId=$PROJECT_ID&limit=1" \
      -H "$AUTH" 2>/dev/null || echo '{}')

    RUN_STATUS=$(echo "$RUNS_RESPONSE" | jq -r '.data[0].status // empty' 2>/dev/null || echo "")

    if [ "$RUN_STATUS" = "$TARGET" ]; then
      echo "PASS: Flow run reached $TARGET (took ${i}s)"
      return 0
    fi

    if [ "$RUN_STATUS" = "INTERNAL_ERROR" ] || [ "$RUN_STATUS" = "FAILED" ] || [ "$RUN_STATUS" = "TIMEOUT" ] || [ "$RUN_STATUS" = "STOPPED" ]; then
      echo "FAIL: Flow run ended with status $RUN_STATUS"
      RUN_ID=$(echo "$RUNS_RESPONSE" | jq -r '.data[0].id // empty' 2>/dev/null || echo "")
      if [ -n "$RUN_ID" ]; then
        echo "Run ID: $RUN_ID"
      fi
      exit 1
    fi

    if [ "$((i % 5))" -eq 0 ]; then
      echo "  Waiting... ${i}s elapsed (status: ${RUN_STATUS:-pending})"
    fi

    sleep 1
  done

  echo "FAIL: Flow run did not reach $TARGET within ${POLL_TIMEOUT}s (last status: ${RUN_STATUS:-unknown})"
  exit 1
}

echo "=== Delay Flow Smoke Test ==="
echo "Base URL:     $BASE_URL"
echo "Poll Timeout: ${POLL_TIMEOUT}s"
echo ""

# Sign in with existing benchmark user (created by benchmark/setup.ts)
echo "--- Signing in ---"
SIGNIN_RESPONSE=$(curl -s --fail-with-body "$API_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')

TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN_RESPONSE" | jq -r '.projectId')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "FAIL: Could not sign in"
  exit 1
fi
echo "Signed in. Project: $PROJECT_ID"

AUTH="Authorization: Bearer $TOKEN"

if [ "$PHASE" = "check" ]; then
  FLOW_ID=$(cat "$DELAY_FLOW_ID_FILE")
  wait_for_run SUCCEEDED
  exit 0
fi

# Wait for delay and webhook pieces to be synced, and pin the exact versions listed
echo "--- Waiting for delay and webhook pieces ---"
for i in $(seq 1 300); do
  PIECES=$(curl -sf "$API_URL/pieces" -H "$AUTH" 2>/dev/null || echo "[]")
  DELAY_VERSION=$(echo "$PIECES" | jq -r '[.[] | select(.name == "@activepieces/piece-delay") | .version][0] // empty' 2>/dev/null || true)
  WEBHOOK_VERSION=$(echo "$PIECES" | jq -r '[.[] | select(.name == "@activepieces/piece-webhook") | .version][0] // empty' 2>/dev/null || true)
  if [ -n "$DELAY_VERSION" ] && [ -n "$WEBHOOK_VERSION" ]; then
    echo "Pieces are available (took ${i}s): delay@$DELAY_VERSION, webhook@$WEBHOOK_VERSION"
    break
  fi
  if [ "$i" -eq 300 ]; then
    echo "FAIL: Delay or webhook piece not available after 300s"
    exit 1
  fi
  sleep 1
done

# Create flow
echo "--- Creating delay flow ---"
FLOW_RESPONSE=$(curl -s --fail-with-body "$API_URL/flows" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "{\"displayName\":\"Delay Smoke Test\",\"projectId\":\"$PROJECT_ID\"}")

FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID"

# Import flow definition: webhook → delay(11s) → code
echo "--- Importing flow definition ---"
curl -s --fail-with-body "$API_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{
    "type": "IMPORT_FLOW",
    "request": {
      "displayName": "Delay Smoke Test",
      "schemaVersion": "17",
      "notes": [],
      "trigger": {
        "name": "trigger",
        "valid": true,
        "displayName": "Catch Webhook",
        "type": "PIECE_TRIGGER",
        "settings": {
          "pieceName": "@activepieces/piece-webhook",
          "pieceVersion": "'"$WEBHOOK_VERSION"'",
          "triggerName": "catch_webhook",
          "input": { "authType": "none", "authFields": {} },
          "propertySettings": {
            "authType": { "type": "MANUAL" },
            "authFields": { "type": "MANUAL", "schema": {} }
          },
          "sampleData": {}
        },
        "nextAction": {
          "name": "step_1",
          "skip": false,
          "type": "PIECE",
          "valid": true,
          "displayName": "Delay For",
          "settings": {
            "pieceName": "@activepieces/piece-delay",
            "pieceVersion": "'"$DELAY_VERSION"'",
            "actionName": "delayFor",
            "input": {
              "unit": "seconds",
              "delayFor": '"$DELAY_SECONDS"'
            },
            "propertySettings": {},
            "errorHandlingOptions": {
              "retryOnFailure": { "value": false },
              "continueOnFailure": { "value": false }
            }
          },
          "nextAction": {
            "name": "step_2",
            "skip": false,
            "type": "CODE",
            "valid": true,
            "displayName": "After Delay",
            "settings": {
              "input": {},
              "sampleData": {},
              "sourceCode": {
                "code": "export const code = async (inputs) => { return { resumed: true }; }",
                "packageJson": "{}"
              },
              "errorHandlingOptions": {
                "retryOnFailure": { "value": false },
                "continueOnFailure": { "value": false }
              }
            }
          }
        }
      }
    }
  }' > /dev/null
echo "Flow definition imported"

# Publish flow
echo "--- Publishing flow ---"
curl -s --fail-with-body "$API_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"type":"LOCK_AND_PUBLISH","request":{}}' > /dev/null

# Enable flow
echo "--- Enabling flow ---"
curl -s --fail-with-body "$API_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"type":"CHANGE_STATUS","request":{"status":"ENABLED"}}' > /dev/null

# Wait for flow to become ENABLED
for i in $(seq 1 30); do
  STATUS=$(curl -s "$API_URL/flows/$FLOW_ID" -H "$AUTH" | jq -r '.status')
  if [ "$STATUS" = "ENABLED" ]; then
    echo "Flow is ENABLED"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "FAIL: Flow not ENABLED after 30s (status: $STATUS)"
    exit 1
  fi
  sleep 1
done

# Trigger the webhook (async — flow will pause at the delay step)
echo ""
echo "--- Triggering webhook ---"
TRIGGER_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test":true}' \
  "http://$BASE_URL/api/v1/webhooks/$FLOW_ID")

if [ "$TRIGGER_CODE" != "200" ]; then
  echo "FAIL: Webhook trigger returned HTTP $TRIGGER_CODE (expected 200)"
  exit 1
fi
echo "Webhook triggered (HTTP $TRIGGER_CODE)"

if [ "$PHASE" = "arm" ]; then
  wait_for_run PAUSED
  echo "$FLOW_ID" > "$DELAY_FLOW_ID_FILE"
  exit 0
fi

wait_for_run SUCCEEDED
echo ""
echo "=== Delay Flow Smoke Test PASSED ==="
