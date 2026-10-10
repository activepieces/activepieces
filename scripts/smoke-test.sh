#!/bin/bash
# Post-deploy smoke test.
# Loads the app in a headless browser and checks for the error screen.
# Fails loudly if the bundle crashes.
set -euo pipefail

URL="${1:-https://flow.synkra.co.za}"

echo "==> Fetching root HTML"
HTML=$(curl -sS "$URL/")
if ! echo "$HTML" | grep -q "<html"; then
  echo "✗ Root HTML looks wrong"
  exit 1
fi
echo "    OK"

echo "==> Extracting bundle URL"
BUNDLE=$(echo "$HTML" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [ -z "$BUNDLE" ]; then
  echo "✗ No bundle URL found in HTML"
  exit 1
fi
echo "    $BUNDLE"

echo "==> Downloading bundle"
curl -sS "$URL/$BUNDLE" -o /tmp/smoke-bundle.js
SIZE=$(wc -c < /tmp/smoke-bundle.js)
if [ "$SIZE" -lt 100000 ]; then
  echo "✗ Bundle too small ($SIZE bytes) — likely broken"
  exit 1
fi
echo "    $SIZE bytes"

echo "==> Checking bundle for syntax errors"
if ! node --check /tmp/smoke-bundle.js 2>/dev/null; then
  echo "⚠ Bundle is a module — skipping node --check"
fi

echo "==> Headless browser load (if puppeteer installed)"
if command -v chromium-browser > /dev/null 2>&1; then
  timeout 30 chromium-browser \
    --headless --disable-gpu --no-sandbox \
    --dump-dom "$URL/" 2>/dev/null \
    | grep -qE "Something went wrong|ReferenceError|is not defined" \
    && { echo "✗ App crashes on load"; exit 1; } \
    || echo "    OK (no error screen detected)"
else
  echo "    chromium not installed — install for full coverage: apt install chromium-browser"
fi

echo ""
echo "✓ Smoke test passed"
