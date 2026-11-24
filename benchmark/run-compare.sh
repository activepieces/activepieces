#!/usr/bin/env bash
# Env:
#   BASELINE_IMAGE, CANDIDATE_IMAGE   required, local or pulled image references
#   OUT_DIR                           default /tmp/bench-compare
#   ROUNDS                            default 3
#   LIGHT_REQUESTS / HEAVY_REQUESTS   default 2000 / 500
#   CONCURRENCY                       default 28 (the execution slots of the shared cell)
#   IDLE_SETTLE_SECONDS / IDLE_SECONDS default 30 / 60, the wait after the load, then the idle sample
#   COMPOSE_ARGS                      default the CI stack (needs 18+ cores for its cpusets)
set -euo pipefail

: "${BASELINE_IMAGE:?BASELINE_IMAGE is required}"
: "${CANDIDATE_IMAGE:?CANDIDATE_IMAGE is required}"
OUT_DIR="${OUT_DIR:-/tmp/bench-compare}"
ROUNDS="${ROUNDS:-3}"
LIGHT_REQUESTS="${LIGHT_REQUESTS:-2000}"
HEAVY_REQUESTS="${HEAVY_REQUESTS:-500}"
CONCURRENCY="${CONCURRENCY:-28}"
IDLE_SETTLE_SECONDS="${IDLE_SETTLE_SECONDS:-30}"
IDLE_SECONDS="${IDLE_SECONDS:-60}"
read -r -a COMPOSE_FILES <<< "${COMPOSE_ARGS:--f benchmark/docker-compose.yml -f benchmark/docker-compose.ci.yml}"

HEAVY_BODY=$(node -e '
const items = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  kind: i % 2 === 0 ? "store" : "map",
  text: Array.from({ length: 400 }, (_, j) => "word" + ((i * 31 + j) % 97)).join(" "),
}))
process.stdout.write(JSON.stringify({ items }))
')

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/{light,heavy,idle}-{baseline,candidate}-*

compose() {
  docker compose "${COMPOSE_FILES[@]}" "$@"
}

capture_stats() {
  local file=$1 flag=$2
  : > "$file"
  while [ -f "$flag" ] && kill -0 "$$" 2>/dev/null; do
    docker stats --no-stream --format '{{json .}}' >> "$file" 2>/dev/null || true
    sleep 2
  done
}

run_load() {
  local flow=$1 flow_id=$2 requests=$3 body=$4 side=$5 round=$6
  local stats="$OUT_DIR/$flow-$side-$round.stats.jsonl" flag
  flag=$(mktemp)
  capture_stats "$stats" "$flag" &
  local stats_pid=$!
  bun run packages/cli/src/benchmark-only.ts \
    --url http://localhost:8080 \
    --requests "$requests" \
    --concurrency "$CONCURRENCY" \
    --project-id "$PROJECT_ID" \
    --flow-id "$flow_id" \
    --body "$body" \
    --json > "$OUT_DIR/$flow-$side-$round.report.json" || [ $? -eq 1 ]
  rm -f "$flag"
  wait "$stats_pid" || true
  node benchmark/aggregate-stats.mjs "$stats" > "$OUT_DIR/$flow-$side-$round.stats.json"
  node benchmark/combine-results.mjs \
    --report "$OUT_DIR/$flow-$side-$round.report.json" \
    --stats "$OUT_DIR/$flow-$side-$round.stats.json" \
    --sha "$side" \
    --label "$flow" \
    --runId "$round" \
    --out "$OUT_DIR/$flow-$side-$round.json"
}

run_side() {
  local side=$1 image=$2 round=$3
  echo "::group::Round $round, $side ($image)"
  docker tag "$image" activepieces-benchmark:local
  compose up -d

  local token_file project_file
  token_file=$(mktemp)
  project_file=$(mktemp)
  LIGHT_FLOW_ID=$(BENCH_TOKEN_FILE="$token_file" BENCH_PROJECT_ID_FILE="$project_file" bun run benchmark/setup.ts)
  HEAVY_FLOW_ID=$(BENCH_FLOW=heavy bun run benchmark/setup.ts)
  PROJECT_ID=$(cat "$project_file")
  AP_API_KEY=$(cat "$token_file")
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::add-mask::$AP_API_KEY"; fi
  export AP_API_KEY
  rm -f "$token_file" "$project_file"

  run_load light "$LIGHT_FLOW_ID" "$LIGHT_REQUESTS" '{"test":true}' "$side" "$round"
  run_load heavy "$HEAVY_FLOW_ID" "$HEAVY_REQUESTS" "$HEAVY_BODY" "$side" "$round"

  sleep "$IDLE_SETTLE_SECONDS"
  local idle_flag
  idle_flag=$(mktemp)
  capture_stats "$OUT_DIR/idle-$side-$round.stats.jsonl" "$idle_flag" &
  local idle_pid=$!
  sleep "$IDLE_SECONDS"
  rm -f "$idle_flag"
  wait "$idle_pid" || true
  node benchmark/aggregate-stats.mjs "$OUT_DIR/idle-$side-$round.stats.jsonl" > "$OUT_DIR/idle-$side-$round.json"

  compose down -v
  echo "::endgroup::"
}

compose down -v

for round in $(seq 1 "$ROUNDS"); do
  if [ $((round % 2)) -eq 1 ]; then
    run_side baseline "$BASELINE_IMAGE" "$round"
    run_side candidate "$CANDIDATE_IMAGE" "$round"
  else
    run_side candidate "$CANDIDATE_IMAGE" "$round"
    run_side baseline "$BASELINE_IMAGE" "$round"
  fi
done
