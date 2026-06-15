#!/usr/bin/env bash
# Phase 0 topology spike for Tier 3 sandbox egress isolation.
# Run inside the privileged e2e container. Validates:
#  1. isolate runs at all in this environment (a real sandboxed process executes)
#  2. a restricted netns + veth /30 lets a process reach ONLY the gateway IP
#  3. internet / metadata are unreachable from the netns (no route)
#  4. isolate runs INSIDE the netns via `ip netns exec` (the core Tier 3 move)
#  5. a process inside isolate-inside-netns can reach the gateway but not the internet
set -uo pipefail

ISO=/usr/local/bin/isolate
BOX=9
NS=ap-egress
GW=10.255.0.1
BOXIP=10.255.0.2
PORT=9999
PASS=0; FAIL=0
ok(){ echo "PASS: $1"; PASS=$((PASS+1)); }
no(){ echo "FAIL: $1"; FAIL=$((FAIL+1)); }

echo "===== [1] isolate runnable + real sandboxed run ====="
$ISO --version >/dev/null 2>&1 && ok "isolate --version" || no "isolate --version"
$ISO --box-id=$BOX --cleanup >/dev/null 2>&1
if BOXDIR=$($ISO --box-id=$BOX --init 2>/dev/null); then ok "isolate --init ($BOXDIR)"; else no "isolate --init"; fi
OUT=$($ISO --box-id=$BOX --run -- /bin/echo hello-isolate 2>/dev/null)
[ "$OUT" = "hello-isolate" ] && ok "isolate --run executes a process" || no "isolate --run (got '$OUT')"

echo "===== [2] build restricted netns + veth /30 (no default route, no NAT) ====="
ip netns del $NS 2>/dev/null
ip netns add $NS && ok "netns add" || no "netns add"
ip link add veth-host type veth peer name veth-box 2>/dev/null && ok "veth pair" || no "veth pair"
ip link set veth-box netns $NS
ip addr add $GW/30 dev veth-host; ip link set veth-host up
ip netns exec $NS ip addr add $BOXIP/30 dev veth-box
ip netns exec $NS ip link set veth-box up
ip netns exec $NS ip link set lo up
echo "   routes in $NS:"; ip netns exec $NS ip route

echo "===== [3] gateway listener; reachability from netns (plain process) ====="
node -e "require('net').createServer(s=>s.end('hi')).listen($PORT,'$GW',()=>console.error('listener up'))" &
LPID=$!; sleep 1
probe(){ ip netns exec $NS node -e "
const net=require('net');const s=net.connect({host:'$1',port:$2});
s.setTimeout(2500);
s.on('connect',()=>{console.log('CONNECTED');s.destroy();process.exit(0)});
s.on('timeout',()=>{console.log('TIMEOUT');process.exit(1)});
s.on('error',e=>{console.log('ERR '+e.code);process.exit(1)});" 2>/dev/null; }
R=$(probe $GW $PORT);   [ "$R" = "CONNECTED" ] && ok "netns -> gateway $GW:$PORT ($R)" || no "netns -> gateway ($R)"
R=$(probe 8.8.8.8 53);  [ "$R" != "CONNECTED" ] && ok "netns -> 8.8.8.8:53 blocked ($R)" || no "netns -> 8.8.8.8 NOT blocked"
R=$(probe 169.254.169.254 80); [ "$R" != "CONNECTED" ] && ok "netns -> metadata blocked ($R)" || no "netns -> metadata NOT blocked"

echo "===== [4+5] isolate INSIDE netns reaching gateway vs internet ====="
$ISO --box-id=$BOX --cleanup >/dev/null 2>&1; $ISO --box-id=$BOX --init >/dev/null 2>&1
runin(){ ip netns exec $NS $ISO --box-id=$BOX --share-net --dir=/usr/=/usr --dir=/lib=/lib --dir=/lib64=/lib64:maybe --dir=/bin=/bin --env=PATH=/usr/bin:/bin --run -- /usr/local/bin/node -e "$1" 2>/dev/null; }
R=$(runin "const s=require('net').connect({host:'$GW',port:$PORT});s.setTimeout(2500);s.on('connect',()=>{console.log('CONNECTED');process.exit(0)});s.on('timeout',()=>{console.log('TIMEOUT');process.exit(1)});s.on('error',e=>{console.log('ERR '+e.code);process.exit(1)});")
[ "$R" = "CONNECTED" ] && ok "isolate+netns -> gateway ($R)" || no "isolate+netns -> gateway ($R)"
R=$(runin "const s=require('net').connect({host:'8.8.8.8',port:53});s.setTimeout(2500);s.on('connect',()=>{console.log('CONNECTED');process.exit(0)});s.on('timeout',()=>{console.log('TIMEOUT');process.exit(1)});s.on('error',e=>{console.log('ERR '+e.code);process.exit(1)});")
[ "$R" != "CONNECTED" ] && ok "isolate+netns -> internet blocked ($R)" || no "isolate+netns -> internet NOT blocked"

kill $LPID 2>/dev/null; $ISO --box-id=$BOX --cleanup >/dev/null 2>&1; ip netns del $NS 2>/dev/null
echo "===== SPIKE RESULT: $PASS passed, $FAIL failed ====="
[ $FAIL -eq 0 ]
