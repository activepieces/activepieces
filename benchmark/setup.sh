#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
MAX_RETRIES=60
RETRY_INTERVAL=5

# Wait for app to be ready
echo "Waiting for app to be ready..." >&2
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "$BASE_URL/flags" > /dev/null 2>&1; then
    echo "App is ready after $((i * RETRY_INTERVAL))s" >&2
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: App did not become ready in time" >&2
    exit 1
  fi
  sleep $RETRY_INTERVAL
done

# Wait for webhook + math-helper pieces to be synced (pieces sync from cloud in batches).
# Under SANDBOX_PROCESS the trigger-enable hook resolves every piece in the flow eagerly, so
# both must be published by the time we call LOCK_AND_PUBLISH — otherwise enable fails.
echo "Waiting for webhook + math-helper pieces to be available..." >&2
PIECES_JSON='[]'
for i in $(seq 1 600); do
  PIECES_JSON=$(curl -sf "$BASE_URL/pieces" 2>/dev/null || echo '[]')
  READY=$(echo "$PIECES_JSON" | jq '
    ([.[].name] | any(. == "@activepieces/piece-webhook")) and
    ([.[].name] | any(. == "@activepieces/piece-math-helper"))' 2>/dev/null || echo "false")
  if [ "$READY" = "true" ]; then
    echo "Both pieces available (took ${i}s)" >&2
    break
  fi
  if [ "$i" -eq 600 ]; then
    echo "ERROR: pieces not available after 600s" >&2
    exit 1
  fi
  sleep 1
done

# Pull the actually-published versions from the registry so we never hard-pin a version that
# has since stopped resolving. Under SANDBOX_PROCESS a missing pinned version is fatal — the
# trigger enable hook resolves everything eagerly and rolls back the whole publish.
WEBHOOK_LATEST=$(echo "$PIECES_JSON" | jq -r '.[] | select(.name == "@activepieces/piece-webhook") | .version')
MATH_LATEST=$(echo "$PIECES_JSON" | jq -r '.[] | select(.name == "@activepieces/piece-math-helper") | .version')
if [ -z "$WEBHOOK_LATEST" ] || [ "$WEBHOOK_LATEST" = "null" ] || [ -z "$MATH_LATEST" ] || [ "$MATH_LATEST" = "null" ]; then
  echo "ERROR: could not resolve piece versions from registry (webhook=$WEBHOOK_LATEST math=$MATH_LATEST)" >&2
  exit 1
fi
echo "Resolved piece versions: webhook=$WEBHOOK_LATEST math-helper=$MATH_LATEST" >&2

# Sign up
echo "Authenticating..." >&2
BENCH_EMAIL="${BENCH_EMAIL:-bench@activepieces.com}"
# Try sign-up (first run creates the platform). On repeat runs public sign-up is disabled once a
# platform exists, so fall back to sign-in with the same fixed credentials. No --fail-with-body here:
# under `set -e` a rejected sign-up would abort the script before we can fall back.
SIGNUP_RESPONSE=$(curl -s "$BASE_URL/authentication/sign-up" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${BENCH_EMAIL}\",\"password\":\"BenchmarkPass1\",\"firstName\":\"Bench\",\"lastName\":\"Mark\",\"trackEvents\":false,\"newsLetter\":false}")
TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token // empty')
PROJECT_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.projectId // empty')

if [ -z "$TOKEN" ]; then
  echo "Sign-up unavailable (platform exists); signing in..." >&2
  SIGNIN_RESPONSE=$(curl -s "$BASE_URL/authentication/sign-in" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${BENCH_EMAIL}\",\"password\":\"BenchmarkPass1\"}")
  TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.token // empty')
  PROJECT_ID=$(echo "$SIGNIN_RESPONSE" | jq -r '.projectId // empty')
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: could not authenticate (sign-up and sign-in both failed)" >&2
  echo "$SIGNUP_RESPONSE" >&2
  exit 1
fi

# Cloud edition returns an ONBOARDING token with projectId=null.
# Complete onboarding by creating a platform + project, which returns a fresh USER token.
if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
  echo "Completing onboarding (creating platform + project)..." >&2
  PLATFORM_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/platforms" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Benchmark"}')
  TOKEN=$(echo "$PLATFORM_RESPONSE" | jq -r '.token')
  PROJECT_ID=$(echo "$PLATFORM_RESPONSE" | jq -r '.projectId')
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    echo "ERROR: Failed to complete onboarding" >&2
    echo "$PLATFORM_RESPONSE" >&2
    exit 1
  fi
fi
echo "Signed up. Project: $PROJECT_ID" >&2

AUTH="Authorization: Bearer $TOKEN"

# Provision a platform API key for the benchmark CLI.
# The key value is only returned on creation and is written to a file with mode 600
# so it never lands in the workflow log via stdout capture.
BENCH_API_KEY_FILE="${BENCH_API_KEY_FILE:-/tmp/bench-api-key}"
echo "Creating platform API key for benchmark CLI..." >&2
API_KEY_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/api-keys" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"displayName":"benchmark-cli"}')
BENCH_API_KEY=$(echo "$API_KEY_RESPONSE" | jq -r '.value // empty')
if [ -z "$BENCH_API_KEY" ] || [ "$BENCH_API_KEY" = "null" ]; then
  echo "ERROR: Failed to create API key" >&2
  echo "$API_KEY_RESPONSE" >&2
  exit 1
fi
umask 077
printf '%s' "$BENCH_API_KEY" > "$BENCH_API_KEY_FILE"
chmod 600 "$BENCH_API_KEY_FILE"
echo "API key written to $BENCH_API_KEY_FILE (mode 600)" >&2

# Create flow
echo "Creating flow..." >&2
FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "{\"displayName\":\"Benchmark Flow\",\"projectId\":\"$PROJECT_ID\"}")

FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID" >&2

# Resolve the CODE step body and Return Response body (parameterizable for isolation smoke).
if [ -n "${CODE_BODY_FILE:-}" ]; then
  if [ ! -f "$CODE_BODY_FILE" ]; then
    echo "ERROR: CODE_BODY_FILE=$CODE_BODY_FILE not found" >&2
    exit 1
  fi
  CODE_STEP_SRC=$(cat "$CODE_BODY_FILE")
else
  CODE_STEP_SRC=$'export const code = async (inputs) => {\n  return { result: Number(inputs.sum) + 1 };\n};\n'
fi

# CODE step input (parameterizable for the memory-limit smoke: a `{{ ... }}` expression here is
# evaluated inside the engine process in UNSANDBOXED mode, so it can exhaust the sandbox memory).
if [ -z "${CODE_INPUT_SUM:-}" ]; then
  CODE_INPUT_SUM='{{step_3}}'
fi

if [ -z "${RESPONSE_BODY:-}" ]; then
  RESPONSE_BODY_JSON='{"hello":"world"}'
elif [ "$RESPONSE_BODY" = "{{step_2}}" ]; then
  RESPONSE_BODY_JSON='"{{step_2}}"'
else
  RESPONSE_BODY_JSON="$RESPONSE_BODY"
fi

# Flow: webhook (latest) -> math-helper addition (latest) -> small CODE step -> return response (latest).
# Versions default to whatever the registry reports as latest, resolved above.
WEBHOOK_VERSION="${WEBHOOK_VERSION:-$WEBHOOK_LATEST}"
MATH_VERSION="${MATH_VERSION:-$MATH_LATEST}"
IMPORT_PAYLOAD=$(jq -n \
  --arg code "$CODE_STEP_SRC" \
  --arg webhookV "$WEBHOOK_VERSION" \
  --arg mathV "$MATH_VERSION" \
  --arg sumInput "$CODE_INPUT_SUM" \
  --argjson body "$RESPONSE_BODY_JSON" \
  '{
    type: "IMPORT_FLOW",
    request: {
      displayName: "Benchmark Flow",
      schemaVersion: "17",
      notes: [],
      trigger: {
        name: "trigger",
        valid: true,
        displayName: "Catch Webhook",
        type: "PIECE_TRIGGER",
        settings: {
          pieceName: "@activepieces/piece-webhook",
          pieceVersion: $webhookV,
          triggerName: "catch_webhook",
          input: { authType: "none", authFields: {} },
          propertySettings: {
            authType: { type: "MANUAL" },
            authFields: { type: "MANUAL", schema: {} },
            liveMarkdown: { type: "MANUAL" },
            syncMarkdown: { type: "MANUAL" },
            testMarkdown: { type: "MANUAL" }
          },
          sampleData: {}
        },
        nextAction: {
          name: "step_3",
          skip: false,
          type: "PIECE",
          valid: true,
          settings: {
            input: { first_number: 2, second_number: 3 },
            pieceName: "@activepieces/piece-math-helper",
            actionName: "addition_math",
            pieceVersion: $mathV,
            sampleData: {},
            propertySettings: {
              first_number: { type: "MANUAL" },
              second_number: { type: "MANUAL" }
            },
            errorHandlingOptions: {
              retryOnFailure: { value: false },
              continueOnFailure: { value: false }
            }
          },
          displayName: "Add",
          nextAction: {
            name: "step_2",
            skip: false,
            type: "CODE",
            valid: true,
            settings: {
              input: { sum: $sumInput },
              sampleData: {},
              sourceCode: { code: $code, packageJson: "{}" },
              errorHandlingOptions: {
                retryOnFailure: { value: false },
                continueOnFailure: { value: false }
              }
            },
            displayName: "Code",
            nextAction: {
              name: "step_1",
              skip: false,
              type: "PIECE",
              valid: true,
              settings: {
                input: {
                  fields: { body: $body, status: 200, headers: {} },
                  respond: "stop",
                  responseType: "json"
                },
                pieceName: "@activepieces/piece-webhook",
                actionName: "return_response",
                sampleData: {},
                pieceVersion: $webhookV,
                propertySettings: {
                  fields: {
                    type: "MANUAL",
                    schema: {
                      body: { type: "JSON", required: true, displayName: "JSON Body" },
                      status: { type: "NUMBER", required: false, displayName: "Status", defaultValue: 200 },
                      headers: { type: "OBJECT", required: false, displayName: "Headers" }
                    }
                  },
                  respond: { type: "MANUAL" },
                  responseType: { type: "MANUAL" }
                },
                errorHandlingOptions: {
                  retryOnFailure: { value: false },
                  continueOnFailure: { value: false }
                }
              },
              displayName: "Return Response"
            }
          }
        }
      }
    }
  }')

# Import full flow via IMPORT_FLOW operation
echo "Importing flow definition..." >&2
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  --data-binary "$IMPORT_PAYLOAD" > /dev/null

# Publish flow
echo "Publishing flow..." >&2
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"type":"LOCK_AND_PUBLISH","request":{}}' > /dev/null

# Enable flow
echo "Enabling flow..." >&2
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"type":"CHANGE_STATUS","request":{"status":"ENABLED"}}' > /dev/null

# Wait for flow to become ENABLED (enabling is async; SANDBOXED mode needs longer)
FLOW_ENABLE_TIMEOUT=${FLOW_ENABLE_TIMEOUT:-30}
echo "Waiting for flow to become ENABLED (timeout: ${FLOW_ENABLE_TIMEOUT}s)..." >&2
for i in $(seq 1 "$FLOW_ENABLE_TIMEOUT"); do
  STATUS=$(curl -s "$BASE_URL/flows/$FLOW_ID" \
    -H "$AUTH" | jq -r '.status')
  if [ "$STATUS" = "ENABLED" ]; then
    echo "Flow is ENABLED" >&2
    break
  fi
  if [ "$i" -eq "$FLOW_ENABLE_TIMEOUT" ]; then
    echo "WARNING: Flow status is '$STATUS' after ${FLOW_ENABLE_TIMEOUT}s, proceeding anyway" >&2
  fi
  sleep 1
done

BENCH_PROJECT_ID_FILE="${BENCH_PROJECT_ID_FILE:-/tmp/bench-project-id}"
printf '%s' "$PROJECT_ID" > "$BENCH_PROJECT_ID_FILE"
echo "Project ID written to $BENCH_PROJECT_ID_FILE" >&2

echo "Setup complete. Flow ID: $FLOW_ID  Project ID: $PROJECT_ID" >&2

echo "$FLOW_ID"
