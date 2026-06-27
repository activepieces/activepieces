#!/usr/bin/env bash
set -euo pipefail

# Benchmark flow: newest webhook trigger -> math-helper (addition) -> return response with the sum.
# Signs in to the existing bench user (created by setup.sh) and reuses the warm Cloud Run pool.

BASE_URL="http://localhost:8080/api/v1"

SIGNIN=$(curl -s --fail-with-body "$BASE_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')
TOKEN=$(echo "$SIGNIN" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN" | jq -r '.projectId')
echo "Signed in. Project: $PROJECT_ID" >&2
AUTH="Authorization: Bearer $TOKEN"

FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Bench Math Flow\",\"projectId\":\"$PROJECT_ID\"}")
FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID" >&2

IMPORT_PAYLOAD=$(jq -n '{
  type: "IMPORT_FLOW",
  request: {
    displayName: "Bench Math Flow",
    schemaVersion: "17",
    notes: [],
    trigger: {
      name: "trigger", valid: true, displayName: "Catch Webhook", type: "PIECE_TRIGGER",
      settings: {
        pieceName: "@activepieces/piece-webhook", pieceVersion: "~0.1.36",
        triggerName: "catch_webhook", input: { authType: "none", authFields: {} },
        propertySettings: {
          authType: { type: "MANUAL" }, authFields: { type: "MANUAL", schema: {} },
          liveMarkdown: { type: "MANUAL" }, syncMarkdown: { type: "MANUAL" }, testMarkdown: { type: "MANUAL" }
        },
        sampleData: {}
      },
      nextAction: {
        name: "step_1", skip: false, type: "PIECE", valid: true,
        settings: {
          input: { first_number: 21, second_number: 21 },
          pieceName: "@activepieces/piece-math-helper", actionName: "addition_math",
          pieceVersion: "~0.0.24", sampleData: {},
          propertySettings: {
            first_number: { type: "MANUAL" }, second_number: { type: "MANUAL" }
          },
          errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } }
        },
        displayName: "Add",
        nextAction: {
          name: "step_2", skip: false, type: "PIECE", valid: true,
          settings: {
            input: { fields: { body: { sum: "{{step_1}}" }, status: 200, headers: {} }, respond: "stop", responseType: "json" },
            pieceName: "@activepieces/piece-webhook", actionName: "return_response",
            sampleData: {}, pieceVersion: "~0.1.36",
            propertySettings: {
              fields: { type: "MANUAL", schema: {
                body: { type: "JSON", required: true, displayName: "JSON Body" },
                status: { type: "NUMBER", required: false, displayName: "Status", defaultValue: 200 },
                headers: { type: "OBJECT", required: false, displayName: "Headers" }
              } },
              respond: { type: "MANUAL" }, responseType: { type: "MANUAL" }
            },
            errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } }
          },
          displayName: "Return Response"
        }
      }
    }
  }
}')

echo "Importing flow..." >&2
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" -H "Content-Type: application/json" -H "$AUTH" --data-binary "$IMPORT_PAYLOAD" > /dev/null
echo "Publishing..." >&2
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" -H "Content-Type: application/json" -H "$AUTH" -d '{"type":"LOCK_AND_PUBLISH","request":{}}' > /dev/null
echo "Enabling..." >&2
curl -s --fail-with-body "$BASE_URL/flows/$FLOW_ID" -H "Content-Type: application/json" -H "$AUTH" -d '{"type":"CHANGE_STATUS","request":{"status":"ENABLED"}}' > /dev/null

FLOW_ENABLE_TIMEOUT=${FLOW_ENABLE_TIMEOUT:-120}
for i in $(seq 1 "$FLOW_ENABLE_TIMEOUT"); do
  STATUS=$(curl -s "$BASE_URL/flows/$FLOW_ID" -H "$AUTH" | jq -r '.status')
  [ "$STATUS" = "ENABLED" ] && { echo "Flow is ENABLED" >&2; break; }
  sleep 1
done
echo "$FLOW_ID"
