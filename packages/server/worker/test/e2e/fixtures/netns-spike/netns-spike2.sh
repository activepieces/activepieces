#!/usr/bin/env bash
# Focused: does `ip netns exec <ns> isolate --share-net` keep the sandboxed
# process in the RESTRICTED netns? Distinguish restricted-netns (gateway OK,
# internet blocked) from isolate's-own-empty-netns (both blocked).
set -uo pipefail
ISO=/usr/local/bin/isolate
BOX=9; NS=ap-egress; GW=10.255.0.1; PORT=9999
ip netns del $NS 2>/dev/null
ip netns add $NS
ip link add veth-host type veth peer name veth-box
ip link set veth-box netns $NS
ip addr add $GW/30 dev veth-host; ip link set veth-host up
ip netns exec $NS ip addr add 10.255.0.2/30 dev veth-box
ip netns exec $NS ip link set veth-box up
ip netns exec $NS ip link set lo up

# HTTP listener on the gateway (main netns)
node -e "require('http').createServer((q,r)=>r.end('GATEWAY-OK')).listen($PORT,'$GW',()=>console.error('listener up'))" &
LPID=$!; sleep 1

$ISO --box-id=$BOX --cleanup >/dev/null 2>&1; $ISO --box-id=$BOX --init >/dev/null 2>&1
MOUNTS="--dir=/usr=/usr --dir=/lib=/lib --dir=/lib64=/lib64:maybe --dir=/bin=/bin --dir=/etc=/etc --dir=/dev=/dev:dev --env=PATH=/usr/bin:/bin:/usr/local/bin --env=HOME=/tmp"

echo "=== [a] isolate-in-netns runs a process at all ==="
ip netns exec $NS $ISO --box-id=$BOX --share-net $MOUNTS --run -- /bin/echo from-isolate-netns

echo "=== [b] isolate-in-netns -> GATEWAY (expect GATEWAY-OK) ==="
ip netns exec $NS $ISO --box-id=$BOX --share-net $MOUNTS --run -- /usr/bin/curl -s --max-time 3 http://$GW:$PORT/ ; echo " [exit=$?]"

echo "=== [c] isolate-in-netns -> INTERNET 1.1.1.1 (expect failure/empty) ==="
ip netns exec $NS $ISO --box-id=$BOX --share-net $MOUNTS --run -- /usr/bin/curl -s --max-time 3 http://1.1.1.1/ ; echo " [exit=$?]"

echo "=== [d] CONTROL: isolate WITHOUT netns -> INTERNET (expect success, proves curl+mounts work) ==="
$ISO --box-id=$BOX --cleanup >/dev/null 2>&1; $ISO --box-id=$BOX --init >/dev/null 2>&1
$ISO --box-id=$BOX --share-net $MOUNTS --run -- /usr/bin/curl -s -o /dev/null -w "http_code=%{http_code}" --max-time 5 http://1.1.1.1/ ; echo " [exit=$?]"

kill $LPID 2>/dev/null; $ISO --box-id=$BOX --cleanup >/dev/null 2>&1; ip netns del $NS 2>/dev/null
