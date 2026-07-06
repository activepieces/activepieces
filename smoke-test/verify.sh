#!/usr/bin/env bash
set -euo pipefail

FLOW_ID="${1:?Usage: verify.sh <flow_id> [base_url] [num_requests]}"
BASE_URL="${2:-localhost:8080}"
NUM_REQUESTS="${3:-5}"

PASS=0
FAIL=0

echo "=== Smoke Test ==="
echo "Flow ID:      $FLOW_ID"
echo "Base URL:     $BASE_URL"
echo "Requests:     $NUM_REQUESTS"
echo ""

# Health check
echo "--- Health check ---"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "http://$BASE_URL/api/v1/flags")
if [ "$HTTP_CODE" = "200" ]; then
  echo "PASS: /api/v1/flags returned 200"
else
  echo "FAIL: /api/v1/flags returned $HTTP_CODE (expected 200)"
  exit 1
fi
echo ""

# Webhook requests
echo "--- Webhook requests ---"
EXPECTED_BODY='{"hello":"world"}'

for i in $(seq 1 "$NUM_REQUESTS"); do
  RESPONSE=$(curl -s -w '\n%{http_code}' --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test":true}' \
    "http://$BASE_URL/api/v1/webhooks/$FLOW_ID/sync")

  BODY=$(echo "$RESPONSE" | sed '$d')
  STATUS=$(echo "$RESPONSE" | tail -n 1)

  if [ "$STATUS" = "200" ] && [ "$BODY" = "$EXPECTED_BODY" ]; then
    echo "PASS [$i/$NUM_REQUESTS]: HTTP $STATUS, body=$BODY"
    PASS=$((PASS + 1))
  else
    echo "FAIL [$i/$NUM_REQUESTS]: HTTP $STATUS, body=$BODY (expected 200, $EXPECTED_BODY)"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "=== Results: $PASS passed, $FAIL failed out of $NUM_REQUESTS ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
