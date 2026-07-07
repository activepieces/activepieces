#!/usr/bin/env bash
set -euo pipefail

# Benchmark flow: webhook trigger -> CODE step that mimics "Apply Watermark" (Jimp) by decoding a
# full-resolution photo into a raw RGBA bitmap and compositing a watermark copy -> return response.
#
# This reproduces the SECOND, distinct OOM mechanism (see PROPS_RESOLVER_AUDIT.md, Appendix):
# a *user-code working-set* OOM, not platform props-resolution overhead. An image's decoded size is
# width x height x 4 bytes and is INDEPENDENT of the compressed file size — a "small" 3 MB JPEG from a
# modern phone is ~24 MP, which decodes to ~96 MB, and watermark compositing keeps a second copy. That
# exceeds the hardcoded 128 MB isolated-vm cap, so V8 aborts the engine process with SIGKILL
# ("Caught fatal signal 9"), which sandbox.ts maps to FlowRunStatus.MEMORY_LIMIT_EXCEEDED.
#
# MEGAPIXELS controls the decoded size (default 24 => ~96 MB bitmap x2 => OOM). Drop to 8-12 to model
# a photo that fits, raise it to model larger cameras. No image library is needed — a raw byte buffer
# of the decoded size is the faithful stand-in for what Jimp/sharp hold in memory.

BASE_URL="http://localhost:8080/api/v1"
MEGAPIXELS="${MEGAPIXELS:-24}"

SIGNIN=$(curl -s --fail-with-body "$BASE_URL/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d '{"email":"bench@activepieces.com","password":"BenchmarkPass1"}')
TOKEN=$(echo "$SIGNIN" | jq -r '.token')
PROJECT_ID=$(echo "$SIGNIN" | jq -r '.projectId')
echo "Signed in. Project: $PROJECT_ID" >&2
AUTH="Authorization: Bearer $TOKEN"

FLOW_RESPONSE=$(curl -s --fail-with-body "$BASE_URL/flows" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"displayName\":\"Bench Image OOM Flow\",\"projectId\":\"$PROJECT_ID\"}")
FLOW_ID=$(echo "$FLOW_RESPONSE" | jq -r '.id')
echo "Flow created: $FLOW_ID" >&2

# CODE step: MEGAPIXELS is baked in via substitution. Allocating the bitmap and a watermarked copy
# mirrors Jimp's peak working set (source decode + composited output held simultaneously).
CODE_STEP="export const code = async () => {
  const megapixels = ${MEGAPIXELS};
  const bytesPerPixel = 4;
  const decodedBytes = Math.floor(megapixels * 1000000 * bytesPerPixel);
  const sourceBitmap = new Uint8Array(decodedBytes);
  for (let i = 0; i < sourceBitmap.length; i += 4096) {
    sourceBitmap[i] = i & 0xff;
  }
  const watermarked = new Uint8Array(sourceBitmap.length);
  watermarked.set(sourceBitmap);
  watermarked[0] = 1;
  return { megapixels, peakBytes: sourceBitmap.length + watermarked.length };
};"

IMPORT_PAYLOAD=$(jq -n --arg code "$CODE_STEP" '{
  type: "IMPORT_FLOW",
  request: {
    displayName: "Bench Image OOM Flow",
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
          sourceCode: { packageJson: "{}", code: $code },
          errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } }
        },
        displayName: "Apply Watermark",
        nextAction: {
          name: "step_2", skip: false, type: "PIECE", valid: true,
          settings: {
            input: { fields: { body: { peakBytes: "{{step_1[\"output\"][\"peakBytes\"]}}" }, status: 200, headers: {} }, respond: "stop", responseType: "json" },
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

echo "Importing flow with MEGAPIXELS=$MEGAPIXELS (decoded ~$((MEGAPIXELS * 4))MB x2)..." >&2
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
