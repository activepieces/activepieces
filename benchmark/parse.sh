#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="${1:-/tmp/hey-output.txt}"

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
TOTAL=$(grep "^\[200\]" "$INPUT_FILE" | awk '{print $2}' || echo "0")
TOTAL_REQUESTS=$(grep "^  Total:" "$INPUT_FILE" | head -1 | awk '{print $2}' || echo "0")

if [ -n "$TOTAL" ] && [ "$TOTAL" != "0" ]; then
  echo ""
  echo "200 OK count:   $TOTAL"
fi

echo ""
echo "========================================="
