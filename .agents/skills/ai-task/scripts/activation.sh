#!/usr/bin/env bash
# usage: activation.sh <since YYYY-MM-DD> <until YYYY-MM-DD> [repo]
# Funnel + flow breakdown for users whose first chat is in [since, until), capped so everyone had 7 days.
set -euo pipefail
D=$(dirname "$0"); SINCE=$1; UNTIL=$2; REPO=${3:-${AP_REPO:-$(git rev-parse --show-toplevel 2>/dev/null)}}
DOC=$REPO/brain/knowledge/flows-execution/chat-activation-metric.md
[ -f "$DOC" ] || { echo "Run from the activepieces repo, or pass its path as the 3rd argument (or set AP_REPO)." >&2; exit 1; }
DEF=$(awk '/^```sql/{f=1;next}/^```/{if(f){exit}}f' "$DOC")
COHORT="where t0 >= '$SINCE'::timestamptz and t0 < least('$UNTIL'::timestamptz, now() - interval '7 days')"
DEF=$(printf '%s\n' "$DEF" | sed "s|where t0 >= :'since'::timestamptz and t0 < now() - interval '7 days'|$COHORT|")
grep -q "least('$UNTIL'" <<<"$DEF" || { echo "Cohort line not found in $DOC; the definition changed, update this script." >&2; exit 1; }
PGQ=${PG_QUERY_TOOL:-$(echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | "$D/mcp.sh" | jq -r '[.result.tools[].name | select(test("^postgres.*_query$"))][0]')}
[ -n "$PGQ" ] && [ "$PGQ" != null ] || { echo "No Postgres replica connection on the box MCP. Ask for replica access." >&2; exit 1; }
T=$(mktemp)
printf '%s\n' "$DEF" > "$T"
echo "== funnel"; "$D/call.sh" "$PGQ" "$(jq -nc --rawfile q "$T" '{sql:$q}')"
awk '/^built_flows as/{exit} {print}' "$T" > "$T.b"
cat "$D/../sql/flow-breakdown.sql" >> "$T.b"
echo; echo "== chat-built flows"; "$D/call.sh" "$PGQ" "$(jq -nc --rawfile q "$T.b" '{sql:$q}')"
rm -f "$T" "$T.b"
