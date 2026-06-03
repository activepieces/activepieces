#!/usr/bin/env bash
set -euo pipefail

FLOW_ID="${1:?Usage: verify-isolation.sh <flow_id> [base_url]}"
BASE_URL="${2:-localhost:8080}"

echo "=== Sandbox Filesystem Isolation Test ==="
echo "Flow ID:  $FLOW_ID"
echo "Base URL: $BASE_URL"
echo ""

RESPONSE=$(curl -s --max-time 60 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"probe":true}' \
  "http://$BASE_URL/api/v1/webhooks/$FLOW_ID/sync")

echo "--- Webhook response ---"
echo "$RESPONSE"
echo ""

if ! echo "$RESPONSE" | jq -e . > /dev/null 2>&1; then
  echo "FAIL: response is not valid JSON"
  exit 1
fi

PASS=0
FAIL=0

assert() {
  local label="$1"
  local filter="$2"
  if echo "$RESPONSE" | jq -e "$filter" > /dev/null 2>&1; then
    echo "PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $label (filter: $filter)"
    FAIL=$((FAIL + 1))
  fi
}

# Hidden paths — must NOT be reachable from inside the sandbox.
assert "/usr/src/app is hidden"          '.paths."/usr/src/app".ok == false'
assert "/usr/src/app uses ENOENT"        '.paths."/usr/src/app".code == "ENOENT"'
assert "/usr/src/app/cache is hidden"    '.paths."/usr/src/app/cache".ok == false'
assert "/usr/src/app/cache uses ENOENT"  '.paths."/usr/src/app/cache".code == "ENOENT"'

# Allowed paths — must remain available for Node + the engine.
assert "/usr/src/node_modules visible"   '.paths."/usr/src/node_modules".ok == true and .paths."/usr/src/node_modules".isDir == true'
assert "/usr/bin visible"                '.paths."/usr/bin".ok == true and .paths."/usr/bin".isDir == true'
assert "/usr/local/bin/node visible"     '.paths."/usr/local/bin/node".ok == true'
assert "/etc visible"                    '.paths."/etc".ok == true and .paths."/etc".isDir == true'
assert "/root visible"                   '.paths."/root".ok == true and .paths."/root".isDir == true'
assert "/root/codes visible"             '.paths."/root/codes".ok == true and .paths."/root/codes".isDir == true'

# Worker-process env vars MUST NOT leak into the sandbox.
for SECRET in AP_JWT_SECRET AP_ENCRYPTION_KEY AP_WORKER_TOKEN AP_POSTGRES_PASSWORD AP_POSTGRES_USERNAME AP_POSTGRES_HOST AP_POSTGRES_DATABASE AP_REDIS_HOST AP_REDIS_PORT AP_FRONTEND_URL; do
  assert "$SECRET not leaked" ".envKeys | index(\"$SECRET\") == null"
done

# Required sandbox env vars must be set.
for REQUIRED in HOME NODE_PATH AP_EXECUTION_MODE AP_SANDBOX_WS_PORT AP_BASE_CODE_DIRECTORY SANDBOX_ID; do
  assert "$REQUIRED is set" ".envKeys | index(\"$REQUIRED\") != null"
done

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
