#!/usr/bin/env bash
set -euo pipefail

# Poll worker machine metrics during a load test
# Reads from the existing /v1/worker-machines endpoint (already wired to system-usage utilities)
# Appends NDJSON to the specified output file for later analysis

OUTPUT_FILE="${1:-metrics.ndjson}"
BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
TOKEN="${TOKEN:-}"
POLL_INTERVAL="${POLL_INTERVAL:-1}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: TOKEN env var required (use the platform token from setup.sh)" >&2
  exit 1
fi

echo "Polling metrics to $OUTPUT_FILE every ${POLL_INTERVAL}s..." >&2

while true; do
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  METRICS=$(curl -s "$BASE_URL/worker-machines" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

  # Flatten the response: emit one line per machine with timestamp + metrics
  echo "$METRICS" | jq -r "
    .[] |
    {
      timestamp: \"$TIMESTAMP\",
      machineId: .id,
      cpuUsagePercentage: .cpuUsagePercentage,
      ramUsagePercentage: .ramUsagePercentage,
      totalRamBytes: .totalRamBytes,
      sandboxes: [
        .sandboxes[] |
        {
          sandboxId: .id,
          memoryUsageBytes: .memoryUsageBytes,
          cpuUsagePercentage: .cpuUsagePercentage
        }
      ]
    }
  " >> "$OUTPUT_FILE" 2>/dev/null || true

  sleep "$POLL_INTERVAL"
done
