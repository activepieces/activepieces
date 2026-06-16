#!/usr/bin/env bash
# Provision (or skip) a per-project engine function on Cloud Functions (2nd gen).
#
# Mirrors what api/.../function-provisioning does at runtime, as a standalone CLI you can use to
# pre-warm projects. Idempotent: if the function already exists it prints the URL and exits
# without redeploying.
#
# Usage:
#   # one-time: build the gen2 source bundle (rebuild whenever the engine changes)
#   ./gcp-deploy.sh --build
#
#   # provision (or skip) a project's gen2 function
#   GCP_PROJECT=activepieces-b3803 \
#   GCP_KEY_FILE=/Users/abuaboud/gcp-deployer-key.json \
#   ENGINE_TOKEN=$(openssl rand -hex 32) \
#   ./gcp-deploy.sh <ap-project-id>
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$DIR/gen2/build"
REGION="${GCP_REGION:-us-central1}"
RUNTIME="${GCP_RUNTIME:-nodejs22}"
EXECUTION_MODE="${AP_EXECUTION_MODE:-UNSANDBOXED}"
KEY_FILE="${GCP_KEY_FILE:-}"

if [[ -n "$KEY_FILE" ]]; then
  export CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE="$KEY_FILE"
fi

if [[ "${1:-}" == "--build" ]]; then
  echo "[gcp] building gen2 source bundle -> $SOURCE_DIR"
  node "$DIR/gen2/esbuild.mjs"
  exit 0
fi

GCP_PROJECT="${GCP_PROJECT:?set GCP_PROJECT}"
PROJECT_ID="${1:?usage: gcp-deploy.sh <ap-project-id>}"
SANITIZED="$(echo "$PROJECT_ID" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9')"
FUNCTION_NAME="$(echo "ap-engine-${SANITIZED}" | cut -c1-63)"

EXISTING_URL="$(gcloud functions describe "$FUNCTION_NAME" \
  --gen2 --region "$REGION" --project "$GCP_PROJECT" \
  --format 'value(serviceConfig.uri)' 2>/dev/null || true)"

if [[ -n "$EXISTING_URL" ]]; then
  echo "[gcp] $FUNCTION_NAME already provisioned -> $EXISTING_URL (skipping deploy)"
  echo "$EXISTING_URL"
  exit 0
fi

: "${ENGINE_TOKEN:?set ENGINE_TOKEN to deploy a new function}"
if [[ ! -f "$SOURCE_DIR/index.js" ]]; then
  echo "[gcp] gen2 bundle missing — run ./gcp-deploy.sh --build first" >&2
  exit 1
fi

echo "[gcp] deploying gen2 function $FUNCTION_NAME from $SOURCE_DIR"
URL="$(gcloud functions deploy "$FUNCTION_NAME" \
  --gen2 \
  --region "$REGION" --project "$GCP_PROJECT" \
  --runtime "$RUNTIME" \
  --source "$SOURCE_DIR" \
  --entry-point engine \
  --trigger-http \
  --allow-unauthenticated \
  --cpu 1 --memory 512Mi \
  --min-instances 0 --max-instances 20 \
  --set-env-vars "AP_ENGINE_TOKEN=${ENGINE_TOKEN},AP_EXECUTION_MODE=${EXECUTION_MODE}" \
  --quiet \
  --format 'value(serviceConfig.uri)')"

echo "[gcp] provisioned $FUNCTION_NAME -> $URL"
echo "$URL"
