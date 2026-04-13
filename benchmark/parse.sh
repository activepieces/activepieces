#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="${1:-/tmp/hey-output.txt}"
JSON_FILE="${2:-}"

if [ ! -f "$INPUT_FILE" ]; then
  echo "ERROR: hey output file not found: $INPUT_FILE"
  exit 1
fi

echo ""
echo "========================================="
echo "         BENCHMARK RESULTS"
echo "========================================="
echo ""

# Extract throughput (requests/sec)
THROUGHPUT=$(grep "Requests/sec:" "$INPUT_FILE" | awk '{print $2}')
echo "Throughput:     $THROUGHPUT req/s"

# Extract average latency
AVG_LATENCY=$(grep "Average:" "$INPUT_FILE" | head -1 | awk '{print $2}')
echo "Mean latency:   ${AVG_LATENCY}s"

# Extract fastest
FASTEST=$(grep "Fastest:" "$INPUT_FILE" | awk '{print $2}')
echo "Fastest:        ${FASTEST}s"

# Extract slowest
SLOWEST=$(grep "Slowest:" "$INPUT_FILE" | awk '{print $2}')
echo "Slowest:        ${SLOWEST}s"

# Extract status code distribution
echo ""
echo "Status codes:"
sed -n '/Status code distribution/,/^$/p' "$INPUT_FILE" | grep -v "Status code distribution" | sed 's/^/  /'

# Extract latency distribution (includes p50, p99 etc)
echo ""
echo "Latency distribution:"
sed -n '/Latency distribution/,/^$/p' "$INPUT_FILE" | grep -v "Latency distribution" | sed 's/^/  /'

# Calculate success rate
TOTAL=$(grep '\[200\].*responses' "$INPUT_FILE" | awk '{print $2}' || echo "0")
TOTAL_REQUESTS=$(grep "^  Total:" "$INPUT_FILE" | head -1 | awk '{print $2}' || echo "0")

if [ -n "$TOTAL" ] && [ "$TOTAL" != "0" ]; then
  echo ""
  echo "200 OK count:   $TOTAL"
fi

echo ""
echo "========================================="

# Write JSON output if a second argument was provided
if [ -n "$JSON_FILE" ]; then
  # Extract latency distribution percentiles
  P50=$(sed -n '/Latency distribution/,/^$/p' "$INPUT_FILE" | grep "50%" | awk '{print $3}')
  P75=$(sed -n '/Latency distribution/,/^$/p' "$INPUT_FILE" | grep "75%" | awk '{print $3}')
  P90=$(sed -n '/Latency distribution/,/^$/p' "$INPUT_FILE" | grep "90%" | awk '{print $3}')
  P99=$(sed -n '/Latency distribution/,/^$/p' "$INPUT_FILE" | grep "99%" | awk '{print $3}')

  cat > "$JSON_FILE" <<JSONEOF
{
  "throughput": "$THROUGHPUT",
  "mean_latency": "$AVG_LATENCY",
  "fastest": "$FASTEST",
  "slowest": "$SLOWEST",
  "ok_count": "$TOTAL",
  "p50": "$P50",
  "p75": "$P75",
  "p90": "$P90",
  "p99": "$P99"
}
JSONEOF
  echo "JSON results written to $JSON_FILE"
fi
