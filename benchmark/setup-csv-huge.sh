#!/usr/bin/env bash
set -euo pipefail

# Benchmark flow: webhook trigger -> CODE step that builds and parses a large CSV
# (ROW_COUNT rows x ~8 columns) into an array of row objects -> LOOP_ON_ITEMS over the rows
# -> return response.
#
# This is the realistic "process a CSV file" memory-stress case: the code step allocates the raw
# CSV string, then an array of ROW_COUNT parsed objects, and returns it. The parsed array becomes
# a step output that the LOOP step's `items` expression references, so the props resolver clones
# the whole array through JSON.stringify/parse + ivm.ExternalCopy into a 128MB isolate on every run.
# At 100k rows the parsed output is tens of MB, exercising both the isolate heap cap and the
# per-token clone cost that findings #2/#3 in PROPS_RESOLVER_AUDIT.md describe.

BASE_URL="http://localhost:8080/api/v1"
ROW_COUNT="${ROW_COUNT:-100000}"

SIGNIN=$(curl -s --fail-with-body "$BASE_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')
TOKEN=$(echo "$SIGNIN" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN" | jq -r '.projectId')
echo "Signed in. Project: $PROJECT_ID" >&2
AUTH="Authorization: Bearer $TOKEN"

FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Bench CSV Huge Flow\",\"projectId\":\"$PROJECT_ID\"}")
FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID" >&2

# CODE step: synthesize a CSV with ROW_COUNT data rows, then parse it back into row objects.
# ROW_COUNT is baked in via string substitution so the fixture stays parameterizable from the shell.
CODE_STEP="function buildAndParseCsv() {
  const rowCount = ${ROW_COUNT};
  const header = ['id', 'first_name', 'last_name', 'email', 'country', 'amount', 'currency', 'created_at'];
  const lines = [header.join(',')];
  for (let i = 0; i < rowCount; i++) {
    lines.push([
      i,
      'First' + i,
      'Last' + i,
      'user' + i + '@example.com',
      'Country' + (i % 200),
      (i * 13 % 100000) / 100,
      'USD',
      '2026-01-01T00:00:00.000Z'
    ].join(','));
  }
  const csv = lines.join('\n');

  const parsedLines = csv.split('\n');
  const cols = parsedLines[0].split(',');
  const rows = [];
  for (let i = 1; i < parsedLines.length; i++) {
    const cells = parsedLines[i].split(',');
    const row = {};
    for (let c = 0; c < cols.length; c++) {
      row[cols[c]] = cells[c];
    }
    rows.push(row);
  }
  return { rowCount: rows.length, bytes: csv.length, rows };
}
return buildAndParseCsv();"

IMPORT_PAYLOAD=$(jq -n --arg code "$CODE_STEP" '{
  type: "IMPORT_FLOW",
  request: {
    displayName: "Bench CSV Huge Flow",
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
        displayName: "Build + Parse CSV",
        nextAction: {
          name: "step_2", skip: false, type: "LOOP_ON_ITEMS", valid: true,
          settings: {
            items: "{{step_1[\"output\"][\"rows\"]}}",
            loopItemsMode: "DYNAMIC"
          },
          displayName: "Loop Rows",
          firstLoopAction: {
            name: "step_3", skip: false, type: "PIECE", valid: true,
            settings: {
              input: { fields: { body: { email: "{{step_2[\"output\"][\"item\"][\"email\"]}}" }, status: 200, headers: {} }, respond: "stop", responseType: "json" },
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

echo "Importing flow with ROW_COUNT=$ROW_COUNT..." >&2
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
