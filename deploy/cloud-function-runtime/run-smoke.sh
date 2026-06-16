#!/usr/bin/env bash
# One command to prove the CLOUD_FUNCTION runtime end-to-end: build bundles, build images,
# run the compose stack, and exit non-zero if the smoke runner fails.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

bash "$DIR/build.sh"

cd "$DIR"
docker compose down -v --remove-orphans >/dev/null 2>&1 || true
docker compose build
set +e
docker compose up --abort-on-container-exit --exit-code-from smoke
CODE=$?
set -e
docker compose down -v --remove-orphans >/dev/null 2>&1 || true

echo "smoke exit code: $CODE"
exit $CODE
