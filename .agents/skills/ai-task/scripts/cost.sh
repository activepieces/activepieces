#!/usr/bin/env bash
# usage: cost.sh [days<=3]  daily chat turns, failure rate and token use per release
D=$(dirname "$0"); DAYS=${1:-2}
[ "$DAYS" -le 3 ] || { echo "Keep it to 3 days or less, or the query times out." >&2; exit 1; }
find_service() {
  local org
  org=$("$D/call.sh" clickhouse_get_organizations '{}' | jq -r '.result[0].id')
  "$D/call.sh" clickhouse_get_services_list "$(jq -nc --arg o "$org" '{organizationId:$o}')" | jq -r '[.result[] | select(.serviceType=="clickhouse")][0].id'
}
SID=${CH_SERVICE_ID:-$(find_service)}
Q=$(sed "s/__DAYS__/$DAYS/" "$D/../sql/cost-watch.sql")
"$D/call.sh" clickhouse_run_select_query "$(jq -nc --arg q "$Q" --arg s "$SID" '{query:$q, serviceId:$s, timeoutSeconds:120}')"
