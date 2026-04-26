#!/usr/bin/env bash
# Renders nginx.conf from nginx.conf.template using OTOM8_SITE_URL.
# Examples:
#   OTOM8_SITE_URL=http://localhost:3000 ./scripts/render-nginx-conf.sh   # local Docker / dev
#   OTOM8_SITE_URL=https://otom8.us ./scripts/render-nginx-conf.sh       # production
set -euo pipefail
cd "$(dirname "$0")/.."
export OTOM8_SITE_URL="${OTOM8_SITE_URL:-http://localhost:3000}"
OTOM8_SITE_URL="${OTOM8_SITE_URL%/}"
if ! command -v envsubst >/dev/null 2>&1; then
  echo "ERROR: envsubst not found. Install gettext (e.g. brew install gettext, or apt install gettext-base)." >&2
  exit 1
fi
envsubst '${OTOM8_SITE_URL}' < nginx.conf.template > nginx.conf
echo "Wrote nginx.conf with OTOM8_SITE_URL=${OTOM8_SITE_URL}"
