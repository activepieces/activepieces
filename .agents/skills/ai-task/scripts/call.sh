#!/usr/bin/env bash
# usage: call.sh <tool> <json-args>
D=$(dirname "$0")
jq -nc --arg n "$1" --argjson a "$2" '{jsonrpc:"2.0",id:3,method:"tools/call",params:{name:$n,arguments:$a}}' | "$D/mcp.sh" | jq -r '.result.content[]?.text // .error // .'
