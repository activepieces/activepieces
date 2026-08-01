#!/usr/bin/env bash
set -euo pipefail

# Real GKE benchmark of the worker-is-the-sandbox model (ADR 0003), against a same-region GCS bucket
# over the S3-interop endpoint with signed URLs. Deploys benchmark/k8s-sandbox.yaml to OUR cluster, runs
# the load test against the app LoadBalancer, and reports cold-boot latency, warm throughput, and the
# per-run breakdown (from worker pod logs). Leaves the cluster up — teardown commands are printed at the end.
#
# Usage: benchmark/run-gke.sh [total_requests] [concurrency]
#   CLUSTER (default ap-sandbox-bench)  ZONE (default europe-west1-b)

TOTAL_REQUESTS=${1:-1000}
CONCURRENCY=${2:-32}
WORKER_CPU=${WORKER_CPU:-500m}
WORKER_REPLICAS=${WORKER_REPLICAS:-16}
REUSE_SANDBOX=${REUSE_SANDBOX:-false}
APP_REPLICAS=${APP_REPLICAS:-2}
APP_CPU=${APP_CPU:-1000m}
APP_IMAGE=${APP_IMAGE:-europe-west1-docker.pkg.dev/activepieces-b3803/poolserver/ap-app:latest}
CLUSTER=${CLUSTER:-ap-sandbox-bench}
ZONE=${ZONE:-europe-west1-b}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export USE_GKE_GCLOUD_AUTH_PLUGIN=True

echo "=== Getting cluster credentials ($CLUSTER / $ZONE) ==="
gcloud container clusters get-credentials "$CLUSTER" --zone "$ZONE" --quiet

echo "=== Minting worker token + injecting into manifest ==="
# The JWT secret is sync'd between the signed worker token and the cluster's AP_JWT_SECRET. Override via
# env for a non-default secret; the fallback is a throwaway value for this ephemeral, torn-down cluster.
# Short-lived (1 day) — a benchmark run is minutes, so there is no reason to mint a long-lived token.
JWT_SECRET="${AP_JWT_SECRET:-benchmark-$(openssl rand -hex 12)}"
TOKEN=$(JWT_SECRET="$JWT_SECRET" node -e "const jwt=require('jsonwebtoken'),crypto=require('crypto');process.stdout.write(jwt.sign({id:crypto.randomUUID(),type:'WORKER'},process.env.JWT_SECRET,{expiresIn:'1d',keyid:'1',algorithm:'HS256',issuer:'activepieces'}))")
MANIFEST=$(mktemp)
sed -e "s|__AP_WORKER_TOKEN__|${TOKEN}|" -e "s|__WORKER_CPU__|${WORKER_CPU}|g" -e "s|__WORKER_REPLICAS__|${WORKER_REPLICAS}|" \
    -e "s|__AP_JWT_SECRET__|${JWT_SECRET}|" \
    -e "s|__REUSE_SANDBOX__|${REUSE_SANDBOX}|" \
    -e "s|__APP_REPLICAS__|${APP_REPLICAS}|" -e "s|__APP_CPU__|${APP_CPU}|" \
    -e "s|__APP_IMAGE__|${APP_IMAGE}|" "$ROOT/benchmark/k8s-sandbox.yaml" > "$MANIFEST"
echo "Worker: ${WORKER_REPLICAS}x @ ${WORKER_CPU} | App: ${APP_REPLICAS}x @ ${APP_CPU} | REUSE=${REUSE_SANDBOX}"

echo "=== Applying manifest ==="
kubectl apply -f "$MANIFEST"
rm -f "$MANIFEST"

# Force fresh WORKER pods so the (same-tag) image is re-pulled — imagePullPolicy:Always gets the new
# digest. The APP must restart too: `envFrom` is read once at container start, so app pods keep the
# JWT secret they booted with while each run substitutes a fresh one into the configmap and into the
# worker token. Restarting only the worker leaves the two signed with different secrets — the app then
# rejects every worker connection, no worker consumes jobs, and the first thing to fail is publishing
# the flow ("Worker did not respond within the safety timeout") ~5 minutes later. Both, or neither.
echo "=== Forcing fresh app rollout (re-read JWT secret) ==="
kubectl rollout restart deployment/app
kubectl rollout status deployment/app --timeout=600s

# Strictly after the app is fully rolled out. A worker that hits an old app pod still holding the
# previous run's JWT secret gets "Authentication error" on the socket handshake and then sits there —
# it does not recover on its own, so the fleet is silently dead and the flow publish times out.
echo "=== Forcing fresh worker rollout (re-pull image) ==="
kubectl rollout restart deployment/worker
kubectl rollout status deployment/worker --timeout=600s

echo "=== Waiting for app LoadBalancer IP ==="
LB_IP=""
for _ in $(seq 1 60); do
  LB_IP=$(kubectl get svc app -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
  [ -n "$LB_IP" ] && break
  sleep 5
done
[ -z "$LB_IP" ] && { echo "No LB IP"; exit 1; }
echo "App LB: http://$LB_IP"
BASE_URL="http://$LB_IP/api/v1"
for _ in $(seq 1 60); do curl -sf "$BASE_URL/flags" >/dev/null 2>&1 && break; sleep 5; done

echo "=== Cluster snapshot ==="
kubectl get pods -o wide | awk 'NR==1 || (/app|worker|minio|postgres|redis/ && ++c<=29)'
WORKERS_READY=$(kubectl get deployment worker -o jsonpath='{.status.readyReplicas}')
echo "Workers ready: ${WORKERS_READY:-0}"

echo "=== IDLE WORKER RAM (connected, before any flow runs) ==="
# Let workers connect + settle, then wait for metrics-server to report, then read working-set memory.
sleep 30
IDLE=""
for _ in $(seq 1 12); do
  IDLE=$(kubectl top pods -l app=worker --no-headers 2>/dev/null || true)
  [ -n "$IDLE" ] && break
  sleep 10
done
if [ -n "$IDLE" ]; then
  echo "$IDLE" | awk '{gsub(/Mi/,"",$3); s+=$3; n++; if($3>mx)mx=$3; if(mn==""||$3<mn)mn=$3}
                       END{printf "  idle RSS per worker: avg %.0f Mi | min %s Mi | max %s Mi  (across %d workers, no flow running)\n", s/n, mn, mx, n}'
else
  echo "  (metrics-server not reporting yet)"
fi

echo "=== Setting up flow ==="
FLOW_ID=$(BASE_URL="$BASE_URL" FLOW_ENABLE_TIMEOUT=60 "$ROOT/benchmark/setup.sh")
echo "Flow ID: $FLOW_ID"
# Load is generated INSIDE the cluster, against the app Service — not from the operator's laptop over the
# public LoadBalancer. Driving 120+ concurrent sync webhooks from a workstation exhausts its ephemeral
# port range (macOS gives ~16k ports; hey then fails with "can't assign requested address") and the run
# collapses in a way that looks exactly like a server-side ceiling. The 120-worker tier is where it bites.
# In-cluster load also drops the internet RTT and the LB hop, so what is measured is server service time.
WEBHOOK="http://app:80/api/v1/webhooks/$FLOW_ID/sync"
HEY_IMAGE=${HEY_IMAGE:-williamyeh/hey}

# Runs hey in a one-shot pod and echoes its stdout. The image's entrypoint IS hey, so only args are passed.
# The pod requests real CPU so the generator is never the thing being throttled.
run_load() {
  local name=$1 n=$2 c=$3
  kubectl delete pod "$name" --ignore-not-found --now >/dev/null 2>&1
  kubectl run "$name" --image="$HEY_IMAGE" --restart=Never --overrides="$(cat <<JSON
{"spec":{"containers":[{"name":"hey","image":"$HEY_IMAGE",
 "args":["-n","$n","-c","$c","-t","120","-m","POST","-H","Content-Type: application/json","-d","{\"test\":true}","$WEBHOOK"],
 "resources":{"requests":{"cpu":"2","memory":"1Gi"}}}]}}
JSON
)" >/dev/null 2>&1
  # Poll .status.phase, NOT the STATUS column of `kubectl get pod` — that column renders a Succeeded pod
  # as "Completed", so matching on "Succeeded" there never fires and every load pod burns the full timeout.
  local phase=""
  for _ in $(seq 1 200); do
    phase=$(kubectl get pod "$name" -o jsonpath='{.status.phase}' 2>/dev/null)
    case "$phase" in Succeeded|Failed) break;; esac
    sleep 3
  done
  # A Failed or still-Running generator produces partial/empty output that parses into a plausible-looking
  # throughput number. Refuse it loudly and leave the pod up to diagnose, rather than publishing a fiction.
  if [ "$phase" != "Succeeded" ]; then
    echo "ERROR: load pod '$name' did not succeed (phase='${phase:-unknown}'). Pod left in place for triage:" >&2
    kubectl logs "$name" --tail=20 >&2 2>/dev/null || true
    return 1
  fi
  kubectl logs "$name" 2>/dev/null
  kubectl delete pod "$name" --ignore-not-found --now >/dev/null 2>&1
}

echo "=== COLD BOOT: first request (cold process + cold cache) ==="
COLD_MS=$(run_load hey-cold 1 1 | awk '/Average:/{printf "%.0f", $2 * 1000}')
echo "Cold boot latency: ${COLD_MS} ms"

# Warmup so the engine processes are hot before the measured pass (warm = AP_REUSE_SANDBOX=true).
# Without it the first ~CONCURRENCY cold forks drag the average down and muddy the warm number.
WARMUP_REQUESTS=${WARMUP_REQUESTS:-500}
echo "=== WARMUP: $WARMUP_REQUESTS requests @ concurrency $CONCURRENCY (not measured) ==="
run_load hey-warmup "$WARMUP_REQUESTS" "$CONCURRENCY" | awk '/Requests\/sec/{print "  warmup "$0}'

echo "=== WARM THROUGHPUT: $TOTAL_REQUESTS requests @ concurrency $CONCURRENCY ==="
# Sample app vs worker CPU during the load test to find the app:worker ratio (is the app the bottleneck?).
( for _ in $(seq 1 40); do
    kubectl top pods --no-headers 2>/dev/null | awk '{role=($1 ~ /^app-/)?"app":($1 ~ /^worker-/)?"worker":($1 ~ /^postgres-/)?"postgres":($1 ~ /^redis-/)?"redis":"other"; cpu=$2+0; print role, cpu}'
    sleep 3
  done > /tmp/topsamples.txt ) &
SAMPLER=$!
LOAD_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
run_load hey-load "$TOTAL_REQUESTS" "$CONCURRENCY" | tee /tmp/hey-gke.txt
kill "$SAMPLER" 2>/dev/null || true

echo ""
echo "=== RESOURCE USAGE during load (app vs worker) — for the ratio ==="
awk '$1=="app"{as+=$2;an++} $1=="worker"{ws+=$2;wn++} $1=="postgres"{ps+=$2;pn++} $1=="redis"{rs+=$2;rn++}
     END{
       printf "  app      : %d samples, avg %.0f m/pod (limit %s)\n", an, (an?as/an:0), "'"$APP_CPU"'"
       printf "  worker   : %d samples, avg %.0f m/pod (limit %s)\n", wn, (wn?ws/wn:0), "'"$WORKER_CPU"'"
       printf "  postgres : %d samples, avg %.0f m   (single pod, the shared singleton)\n", pn, (pn?ps/pn:0)
       printf "  redis    : %d samples, avg %.0f m   (single pod, the shared singleton)\n", rn, (rn?rs/rn:0)
     }' /tmp/topsamples.txt 2>/dev/null || echo "  (no samples)"

echo ""
echo "=== PER-RUN BREAKDOWN (avg ms across the measured pass only, from worker pod logs) ==="
# --since-time is the measured pass's start, so the cold first request and the warmup pass are excluded
# from the averages — this block describes warm steady state, nothing else.
# Format-agnostic on purpose. The worker ignores AP_LOG_PRETTY and renders the `job.execute` wide event
# with the pretty renderer (`timings: sandboxRunMs=125 ...`), but a JSON drain writes the same keys as
# `"sandboxRunMs":125`. Strip ANSI, then harvest every `<name>Ms` number off the timings line either way —
# parsing the keys rather than the container makes this survive the next renderer change.
# The `|| true` on both greps matters under `set -euo pipefail`: a measured window with no timing events
# makes grep exit 1, which would kill the script before awk can report it — taking the summary and the
# teardown instructions with it. Let the empty stream reach awk and say "no timing samples found".
{ kubectl logs -l app=worker --tail=-1 --prefix=false --since-time="$LOAD_START" 2>/dev/null || true; } \
  | sed 's/\x1b\[[0-9;]*m//g' \
  | { grep -E 'timings' || true; } \
  | { grep -oE '[a-zA-Z]+Ms"?[:=][0-9]+' || true; } \
  | tr -d '"' | tr ':' '=' \
  | awk -F= '{s[$1]+=$2; n[$1]++}
         END{
           runs = n["executionMs"]
           if(runs==0){print "  (no timing samples found)"; exit}
           printf "  samples              : %d runs\n", runs
           printf "  -- provisioning --\n"
           printf "  flow bundle download : %.1f ms\n", (n["flowBundleDownloadMs"]?s["flowBundleDownloadMs"]/n["flowBundleDownloadMs"]:0)
           printf "  pieces install       : %.1f ms\n", (n["installPiecesMs"]?s["installPiecesMs"]/n["installPiecesMs"]:0)
           printf "  engine install       : %.1f ms  (V8-cached)\n", (n["installEngineMs"]?s["installEngineMs"]/n["installEngineMs"]:0)
           printf "  provision (total)    : %.1f ms\n", (n["provisionMs"]?s["provisionMs"]/n["provisionMs"]:0)
           printf "  -- engine execution timeline --\n"
           printf "  sandbox start (boot) : %.1f ms  (fork + Node + parse + isolated-vm init + connect)\n", (n["sandboxStartMs"]?s["sandboxStartMs"]/n["sandboxStartMs"]:0)
           printf "  sandbox run (flow)   : %.1f ms  (webhook -> math -> code -> response)\n", (n["sandboxRunMs"]?s["sandboxRunMs"]/n["sandboxRunMs"]:0)
           printf "  execution (total)    : %.1f ms\n", (n["executionMs"]?s["executionMs"]/n["executionMs"]:0)
         }'

echo ""
echo "=== SUMMARY ==="
echo "Model: worker-is-the-sandbox on GKE | $CLUSTER | workers=${WORKERS_READY} @ ${WORKER_CPU}/1G | concurrency=1 | REUSE_SANDBOX=${REUSE_SANDBOX} | SANDBOX_CODE_ONLY | S3=GCS-europe-west1+signed-urls"
echo "Cold boot latency : ${COLD_MS} ms"
echo -n "Warm throughput   : "; awk '/Requests\/sec/{print $2" req/s"}' /tmp/hey-gke.txt
awk '/Total:|Average:|Slowest:|Fastest:/{print "  "$0}' /tmp/hey-gke.txt
echo ""
echo "Teardown when done:  kubectl delete -f benchmark/k8s-sandbox.yaml   (workload)"
echo "                     gcloud container clusters delete $CLUSTER --zone $ZONE   (cluster)"
