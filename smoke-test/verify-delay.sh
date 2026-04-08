#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-localhost:8080}"
API_URL="http://$BASE_URL/api/v1"
POLL_TIMEOUT="${2:-60}"

echo "=== Delay Flow Smoke Test ==="
echo "Base URL:     $BASE_URL"
echo "Poll Timeout: ${POLL_TIMEOUT}s"
echo ""

# Sign in with existing benchmark user (created by benchmark/setup.sh)
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

# Wait for delay piece to be synced
echo "--- Waiting for delay piece ---"
for i in $(seq 1 300); do
  HAS_DELAY=$(curl -sf "$API_URL/pieces" 2>/dev/null | jq '[.[].name] | any(. == "@activepieces/piece-delay")' 2>/dev/null || echo "false")
  if [ "$HAS_DELAY" = "true" ]; then
    echo "Delay piece is available (took ${i}s)"
    break
  fi
  if [ "$i" -eq 300 ]; then
    echo "FAIL: Delay piece not available after 300s"
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
          "pieceVersion": "~0.1.29",
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
            "pieceVersion": "~0.3.26",
            "actionName": "delayFor",
            "input": {
              "unit": "seconds",
              "delayFor": 11
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

# Poll flow runs for completion (delay is 11s, allow up to POLL_TIMEOUT)
echo "--- Waiting for flow run to complete (timeout: ${POLL_TIMEOUT}s) ---"
for i in $(seq 1 "$POLL_TIMEOUT"); do
  RUNS_RESPONSE=$(curl -s "$API_URL/flow-runs?flowId=$FLOW_ID&projectId=$PROJECT_ID&limit=1" \
    -H "$AUTH" 2>/dev/null || echo '{}')

  RUN_STATUS=$(echo "$RUNS_RESPONSE" | jq -r '.data[0].status // empty' 2>/dev/null || echo "")

  if [ "$RUN_STATUS" = "SUCCEEDED" ]; then
    echo "PASS: Flow run completed with status SUCCEEDED (took ${i}s)"
    echo ""
    echo "=== Delay Flow Smoke Test PASSED ==="
    exit 0
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

echo "FAIL: Flow run did not complete within ${POLL_TIMEOUT}s (last status: ${RUN_STATUS:-unknown})"
exit 1
