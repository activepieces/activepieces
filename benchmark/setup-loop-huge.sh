#!/usr/bin/env bash
set -euo pipefail

# Benchmark flow: webhook trigger -> CODE step emitting Google-Docs-shaped ~17MB nested JSON
# -> LOOP_ON_ITEMS over paragraphs -> return response
# Tests props-resolver cost on large payloads referenced by loops in the RUN path.

BASE_URL="http://localhost:8080/api/v1"
PARAGRAPH_COUNT="${PARAGRAPH_COUNT:-10000}"

SIGNIN=$(curl -s --fail-with-body "$BASE_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')
TOKEN=$(echo "$SIGNIN" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN" | jq -r '.projectId')
echo "Signed in. Project: $PROJECT_ID" >&2
AUTH="Authorization: Bearer $TOKEN"

FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Bench Loop Huge Flow\",\"projectId\":\"$PROJECT_ID\"}")
FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID" >&2

# CODE step generates a Google-Docs-shaped payload; PARAGRAPH_COUNT is baked in via substitution.
CODE_STEP="function buildPayload() {
  const content = [];
  const paragraphCount = ${PARAGRAPH_COUNT};
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
            content: 'Paragraph ' + i + ' text\n',
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
return buildPayload();"

IMPORT_PAYLOAD=$(jq -n --arg code "$CODE_STEP" '{
  type: "IMPORT_FLOW",
  request: {
    displayName: "Bench Loop Huge Flow",
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
          name: "step_2", skip: false, type: "LOOP_ON_ITEMS", valid: true,
          settings: {
            items: "{{step_1[\"output\"][\"body\"][\"content\"]}}",
            loopItemsMode: "DYNAMIC"
          },
          displayName: "Loop Paragraphs",
          firstLoopAction: {
            name: "step_3", skip: false, type: "PIECE", valid: true,
            settings: {
              input: { fields: { body: { index: "{{step_2[\"output\"][\"item\"][\"startIndex\"]}}" }, status: 200, headers: {} }, respond: "stop", responseType: "json" },
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
