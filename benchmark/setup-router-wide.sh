#!/usr/bin/env bash
set -euo pipefail

# Benchmark flow: webhook trigger -> CODE step emitting large nested JSON
# -> ROUTER with N branches (parameterized), non-matching branches reference the payload
# -> only fallback branch executes -> return response
# Tests router eager-all-branches resolution cost in the RUN path.

BASE_URL="http://localhost:8080/api/v1"
BRANCH_COUNT="${BRANCH_COUNT:-10}"

SIGNIN=$(curl -s --fail-with-body "$BASE_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')
TOKEN=$(echo "$SIGNIN" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN" | jq -r '.projectId')
echo "Signed in. Project: $PROJECT_ID" >&2
AUTH="Authorization: Bearer $TOKEN"

FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Bench Router Wide Flow\",\"projectId\":\"$PROJECT_ID\"}")
FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID" >&2

# CODE step generates the same large payload
CODE_STEP='function buildPayload() {
  const content = [];
  const paragraphCount = 5000;
  for (let i = 0; i < paragraphCount; i++) {
    const startIndex = i * 100;
    const endIndex = startIndex + 99;
    content.push({
      startIndex,
      endIndex,
      paragraph: {
        elements: [{
          startIndex,
          endIndex,
          textRun: {
            content: `Paragraph ${i} text\n`,
            textStyle: {
              bold: false, italic: false, underline: false,
              backgroundColor: {}, foregroundColor: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
              fontSize: { magnitude: 11, unit: "PT" },
              weightedFontFamily: { fontFamily: "Arial", weight: 400 }
            }
          }
        }],
        paragraphStyle: {
          namedStyleType: "NORMAL_TEXT", alignment: "START", direction: "LEFT_TO_RIGHT",
          lineSpacing: 100, spaceAbove: { magnitude: 0, unit: "PT" }, spaceBelow: { magnitude: 0, unit: "PT" }
        }
      }
    });
  }
  return { documentId: "doc-id", title: "Template", revisionId: "rev-1", body: { content } };
}
return buildPayload();'

# Build router branches: first N-1 are non-matching conditions that reference the large payload,
# last one is the fallback that actually matches
BRANCHES=$(jq -n \
  --argjson branchCount "$BRANCH_COUNT" \
  '[range(0; $branchCount) |
    if . < $branchCount - 1 then
      {
        branchType: "CONDITION",
        branchName: "Branch \(.+1)",
        conditions: [[{
          operator: "TEXT_CONTAINS",
          firstValue: "{{step_1[\"output\"][\"body\"][\"content\"][0][\"paragraph\"][\"elements\"][0][\"textRun\"][\"content\"]}}",
          secondValue: "NEVER_MATCHES_THIS",
          caseSensitive: true
        }]]
      }
    else
      {
        branchType: "FALLBACK",
        branchName: "Fallback"
      }
    end]')

# Create response actions for each branch (all fallback to simple response)
RESPONSE_ACTION=$(jq -n '{
  name: "step_3", skip: false, type: "PIECE", valid: true,
  settings: {
    input: { fields: { body: { status: "ok" }, status: 200, headers: {} }, respond: "stop", responseType: "json" },
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
}')

CHILDREN=$(jq -n \
  --argjson branchCount "$BRANCH_COUNT" \
  --argjson response "$RESPONSE_ACTION" \
  '[range(0; $branchCount) | $response]')

IMPORT_PAYLOAD=$(jq -n --arg code "$CODE_STEP" \
  --argjson branches "$BRANCHES" \
  --argjson children "$CHILDREN" \
  '{
  type: "IMPORT_FLOW",
  request: {
    displayName: "Bench Router Wide Flow",
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
        name: "step_1", skip: false, type: "CODE", valid: true,
        settings: {
          input: {},
          sourceCode: { packageJson: "", code: $code }
        },
        displayName: "Generate Docs",
        nextAction: {
          name: "step_2", skip: false, type: "ROUTER", valid: true,
          settings: {
            branches: $branches,
            executionType: "EXECUTE_FIRST_MATCH"
          },
          children: $children,
          displayName: "Wide Router"
        }
      }
    }
  }
}')

echo "Importing flow with $BRANCH_COUNT branches..." >&2
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
