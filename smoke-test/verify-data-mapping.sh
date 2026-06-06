#!/usr/bin/env bash
set -euo pipefail

# Data-mapping smoke: verifies that a step can reference another step's output.
# The flow (set up with FLOW_SCHEMA_VERSION=22 and a Return Response body of
# {"name":"{{trigger.body.firstName}}"}) maps a field from the webhook trigger
# into the response. Regression guard for step-output reference resolution
# (a bare {{trigger.body.x}} reference reaching the engine unmigrated).

FLOW_ID="${1:?Usage: verify-data-mapping.sh <flow_id> [base_url] [num_requests]}"
BASE_URL="${2:-localhost:8080}"
NUM_REQUESTS="${3:-5}"

PASS=0
FAIL=0

echo "=== Data Mapping Smoke Test ==="
echo "Flow ID:      $FLOW_ID"
echo "Base URL:     $BASE_URL"
echo "Requests:     $NUM_REQUESTS"
echo ""

for i in $(seq 1 "$NUM_REQUESTS"); do
  NAME="Aria-$i"
  EXPECTED_BODY="{\"name\":\"$NAME\"}"
  RESPONSE=$(curl -s -w '\n%{http_code}' --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"$NAME\"}" \
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
