#!/usr/bin/env bash
# Run every unlabeled batch with CONC in flight. Resumable: a finished batch is
# skipped on re-run. Bails out the moment Codex reports a usage/rate limit, so a
# quota wall stops the job instead of burning every remaining request on errors.
set -uo pipefail
cd "$(dirname "$0")"

CONC="${CONC:-6}"
rm -f out/STOP
START=$(date +%s)
running=0
launched=0

for f in batches/batch_*.txt; do
    b=$(basename "$f" .txt); b=${b#batch_}
    [ -s "out/batch_${b}.json" ] && continue
    [ -f out/STOP ] && break

    ./run_batch.sh "$b" >> out/drive.log 2>&1 &
    running=$((running + 1)); launched=$((launched + 1))

    if [ "$running" -ge "$CONC" ]; then
        wait -n
        running=$((running - 1))
        # run_batch.sh writes out/STOP when Codex itself reports a usage wall.
        if [ -f out/STOP ]; then
            echo "STOPPED: usage/rate limit after $launched launches" >> out/drive.log
            break
        fi
    fi
done
wait

DONE=$(ls out/batch_*.json 2>/dev/null | wc -l)
TOK=$(for l in out/batch_*.log; do grep -A1 '^tokens used' "$l" | tail -1 | tr -d ', '; done | paste -sd+ | bc)
echo "FINISHED batches=$DONE/$(ls batches/*.txt | wc -l) wall=$(( $(date +%s) - START ))s tokens=${TOK}" >> out/drive.log
