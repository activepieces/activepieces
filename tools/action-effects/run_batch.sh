#!/usr/bin/env bash
# Label one batch with Codex. Writes out/batch_NNNN.json (the model's JSON) and
# out/batch_NNNN.log (full transcript incl. token usage). Skips work already done.
set -uo pipefail
cd "$(dirname "$0")"

B="$1"
MODEL="${MODEL:-gpt-5.6-luna}"
EFFORT="${EFFORT:-low}"
BATCHES="${BATCHES:-batches}"
OUTDIR="${OUTDIR:-out}"
mkdir -p "$OUTDIR"
OUT="${OUTDIR}/batch_${B}.json"
LOG="${OUTDIR}/batch_${B}.log"

if [ -s "$OUT" ] && python3 -c "import json,sys; json.load(open('$OUT'))" 2>/dev/null; then
    echo "skip $B (done)"
    exit 0
fi

START=$(date +%s)
timeout 900 codex exec \
    --ephemeral \
    --skip-git-repo-check \
    -s read-only \
    -m "$MODEL" \
    -c model_reasoning_effort="$EFFORT" \
    --output-schema label_schema.json \
    -o "$OUT" \
    < "${BATCHES}/batch_${B}.txt" > "$LOG" 2>&1
RC=$?
END=$(date +%s)

# A usage wall only ever shows up on Codex's own ERROR lines. Matching anywhere in the
# log false-positives on payload text (an EV charging profile description says "rate limits").
if grep -E '^ERROR:|"status": *429' "$LOG" | grep -qiE 'rate.?limit|usage limit|quota|429|too many requests'; then
    touch "${OUTDIR}/STOP"
    echo "batch $B hit a usage/rate limit — signalled STOP"
fi

TOKENS=$(grep -A1 '^tokens used' "$LOG" | tail -1 | tr -d ', ')
COUNT=$(python3 -c "
import json
try:
    print(len(json.load(open('$OUT'))['labels']))
except Exception:
    print(0)
" 2>/dev/null)
echo "batch $B rc=$RC secs=$((END-START)) tokens=${TOKENS:-?} labels=${COUNT:-0}"
[ "$RC" -eq 0 ] && [ "${COUNT:-0}" -gt 0 ]
