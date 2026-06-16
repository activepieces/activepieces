#!/usr/bin/env bash
# Builds the two host bundles the images need: the engine function and the smoke runner.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "[build] engine bundle..."
( cd "$REPO_ROOT/packages/server/engine" && node esbuild.config.mjs )

echo "[build] smoke bundle..."
node "$REPO_ROOT/deploy/cloud-function-runtime/smoke/esbuild.mjs"

echo "[build] done"
