#!/usr/bin/env bash
set -euo pipefail

# Exercises the S3 file-storage path end to end against a stack started with
# AP_FILE_STORAGE_LOCATION=S3 (and optionally AP_S3_USE_SIGNED_URLS=true).
#
# It runs the webhook flow (which writes the run log to S3 — the WRITE path),
# then fetches the populated flow run, which forces the app to read that run
# log back out of S3 (the READ path; a 307 redirect to a presigned URL when
# signed URLs are enabled). Both must work for the run to come back populated.

FLOW_ID="${1:?Usage: verify-s3.sh <flow_id> [base_url] [num_requests]}"
BASE_URL="${2:-localhost:8080}"
NUM_REQUESTS="${3:-5}"
API_URL="http://$BASE_URL/api/v1"

PASS=0
FAIL=0

echo "=== S3 Storage Smoke Test ==="
echo "Flow ID:  $FLOW_ID"
echo "Base URL: $BASE_URL"
echo "Requests: $NUM_REQUESTS"
echo ""

# Sign in with the existing benchmark user (created by benchmark/setup.sh).
echo "--- Signing in ---"
SIGNIN_RESPONSE=$(curl -s --fail-with-body "$API_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')

TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN_RESPONSE" | jq -r '.projectId')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "FAIL: Could not sign in"
  echo "$SIGNIN_RESPONSE"
  exit 1
fi
echo "Signed in. Project: $PROJECT_ID"
AUTH="Authorization: Bearer $TOKEN"
echo ""

# WRITE path: run the flow. Each sync run persists its run log to S3.
echo "--- Webhook requests (S3 write path) ---"
EXPECTED_BODY='{"hello":"world"}'
for i in $(seq 1 "$NUM_REQUESTS"); do
  RESPONSE=$(curl -s -w '\n%{http_code}' --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test":true}' \
    "$API_URL/webhooks/$FLOW_ID/sync")

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

# READ path: fetch the latest run, then load it fully so the app reads the run
# log back out of S3 and hydrates the steps.
echo "--- Flow run read-back (S3 read path) ---"
RUN_ID=""
for i in $(seq 1 30); do
  RUN_ID=$(curl -s "$API_URL/flow-runs?flowId=$FLOW_ID&projectId=$PROJECT_ID&limit=1" \
    -H "$AUTH" 2>/dev/null | jq -r '.data[0].id // empty' 2>/dev/null || echo "")
  if [ -n "$RUN_ID" ]; then
    break
  fi
  sleep 1
done

if [ -z "$RUN_ID" ]; then
  echo "FAIL: No flow run found for flow $FLOW_ID"
  FAIL=$((FAIL + 1))
else
  echo "Latest run: $RUN_ID"
  # Poll until the run reaches a terminal status — the run can still be RUNNING the moment its
  # id first appears, which otherwise fails the status assertion spuriously.
  RUN=""
  RUN_STATUS=""
  for i in $(seq 1 30); do
    RUN=$(curl -s --fail-with-body "$API_URL/flow-runs/$RUN_ID" -H "$AUTH")
    RUN_STATUS=$(echo "$RUN" | jq -r '.status // empty')
    if [ "$RUN_STATUS" != "RUNNING" ] && [ "$RUN_STATUS" != "PAUSED" ] && [ -n "$RUN_STATUS" ]; then
      break
    fi
    sleep 1
  done
  HAS_STEPS=$(echo "$RUN" | jq -e '(.steps | type == "object") and (.steps | length > 0)' > /dev/null 2>&1 && echo "true" || echo "false")

  if [ "$RUN_STATUS" = "SUCCEEDED" ]; then
    echo "PASS: run status is SUCCEEDED"
    PASS=$((PASS + 1))
  else
    echo "FAIL: run status is '$RUN_STATUS' (expected SUCCEEDED)"
    FAIL=$((FAIL + 1))
  fi

  if [ "$HAS_STEPS" = "true" ]; then
    echo "PASS: run steps hydrated from S3 log ($(echo "$RUN" | jq -r '.steps | keys | join(", ")'))"
    PASS=$((PASS + 1))
  else
    echo "FAIL: run steps missing — S3 log read-back failed"
    FAIL=$((FAIL + 1))
  fi
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
