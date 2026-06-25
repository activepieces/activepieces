#!/usr/bin/env bash
set -euo pipefail

# Real GKE benchmark of the worker-is-the-sandbox model (ADR 0003), with in-cluster MinIO as a
# same-region S3 + signed URLs. Deploys benchmark/k8s-sandbox.yaml to OUR cluster, runs the load test
# against the app LoadBalancer, and reports cold-boot latency, warm throughput, and the per-run
# breakdown (from worker pod logs). Leaves the cluster up — teardown commands are printed at the end.
#
# Usage: benchmark/run-gke.sh [total_requests] [concurrency]
#   CLUSTER (default ap-sandbox-bench)  ZONE (default europe-west1-b)  WORKER_IMAGE_TAG

TOTAL_REQUESTS=${1:-1000}
CONCURRENCY=${2:-32}
WORKER_CPU=${WORKER_CPU:-500m}
WORKER_REPLICAS=${WORKER_REPLICAS:-16}
REUSE_SANDBOX=${REUSE_SANDBOX:-false}
CLEAN_CACHE=${CLEAN_CACHE:-true}
APP_REPLICAS=${APP_REPLICAS:-2}
APP_CPU=${APP_CPU:-1500m}
CLUSTER=${CLUSTER:-ap-sandbox-bench}
ZONE=${ZONE:-us-central1-a}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export USE_GKE_GCLOUD_AUTH_PLUGIN=True

echo "=== Getting cluster credentials ($CLUSTER / $ZONE) ==="
gcloud container clusters get-credentials "$CLUSTER" --zone "$ZONE" --quiet

echo "=== Minting worker token + injecting into manifest ==="
TOKEN=$(node -e "const jwt=require('jsonwebtoken'),crypto=require('crypto');process.stdout.write(jwt.sign({id:crypto.randomUUID(),type:'WORKER'},'benchmark-secret-key-for-testing',{expiresIn:'100y',keyid:'1',algorithm:'HS256',issuer:'activepieces'}))")
MANIFEST=$(mktemp)
sed -e "s|__AP_WORKER_TOKEN__|${TOKEN}|" -e "s|__WORKER_CPU__|${WORKER_CPU}|g" -e "s|__WORKER_REPLICAS__|${WORKER_REPLICAS}|" \
    -e "s|__REUSE_SANDBOX__|${REUSE_SANDBOX}|" -e "s|__CLEAN_CACHE__|${CLEAN_CACHE}|" \
    -e "s|__APP_REPLICAS__|${APP_REPLICAS}|" -e "s|__APP_CPU__|${APP_CPU}|" "$ROOT/benchmark/k8s-sandbox.yaml" > "$MANIFEST"
echo "Worker: ${WORKER_REPLICAS}x @ ${WORKER_CPU} | App: ${APP_REPLICAS}x @ ${APP_CPU} | REUSE=${REUSE_SANDBOX} | clean-cache=${CLEAN_CACHE}"

echo "=== Applying manifest ==="
kubectl apply -f "$MANIFEST"
rm -f "$MANIFEST"

# Force fresh WORKER pods so the (same-tag) image is re-pulled — imagePullPolicy:Always gets the new
# digest. Only the worker image changes between runs; restarting the app would destabilize signup.
echo "=== Forcing fresh worker rollout (re-pull image) ==="
kubectl rollout restart deployment/worker

echo "=== Waiting for app + worker rollouts ==="
kubectl rollout status deployment/app --timeout=300s
kubectl rollout status deployment/worker --timeout=300s

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
kubectl get pods -o wide | awk 'NR==1 || /app|worker|minio|postgres|redis/' | head -30
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
WEBHOOK="http://$LB_IP/api/v1/webhooks/$FLOW_ID/sync"

echo "=== COLD BOOT: first request (cold process + cold cache) ==="
COLD_MS=$(curl -s -o /dev/null -w '%{time_total}' -m 120 -X POST -H 'Content-Type: application/json' -d '{"test":true}' "$WEBHOOK" | awk '{printf "%.0f", $1 * 1000}')
echo "Cold boot latency: ${COLD_MS} ms"

echo "=== WARM THROUGHPUT: $TOTAL_REQUESTS requests @ concurrency $CONCURRENCY ==="
# Sample app vs worker CPU during the load test to find the app:worker ratio (is the app the bottleneck?).
( for _ in $(seq 1 40); do
    kubectl top pods --no-headers 2>/dev/null | awk '{role=($1 ~ /^app-/)?"app":($1 ~ /^worker-/)?"worker":"other"; cpu=$2+0; print role, cpu}'
    sleep 3
  done > /tmp/topsamples.txt ) &
SAMPLER=$!
hey -n "$TOTAL_REQUESTS" -c "$CONCURRENCY" -t 120 -m POST -H 'Content-Type: application/json' -d '{"test":true}' "$WEBHOOK" | tee /tmp/hey-gke.txt
kill "$SAMPLER" 2>/dev/null || true

echo ""
echo "=== RESOURCE USAGE during load (app vs worker) — for the ratio ==="
awk '$1=="app"{as+=$2;an++} $1=="worker"{ws+=$2;wn++}
     END{
       printf "  app    : %d samples, avg %.0f m/pod (limit %s)\n", an, (an?as/an:0), "'"$APP_CPU"'"
       printf "  worker : %d samples, avg %.0f m/pod (limit %s)\n", wn, (wn?ws/wn:0), "'"$WORKER_CPU"'"
     }' /tmp/topsamples.txt 2>/dev/null || echo "  (no samples)"

echo ""
echo "=== PER-RUN BREAKDOWN (avg ms across all flow runs, from worker pod logs) ==="
kubectl logs -l app=worker --tail=-1 --prefix=false --since=20m 2>/dev/null \
  | jq -rR 'fromjson? | select(.event=="job.execute" and .timings)
            | [.timings.flowBundleDownloadMs, .timings.installPiecesMs, .timings.installEngineMs, .timings.provisionMs, .timings.executionMs, .timings.sandboxStartMs, .timings.sandboxRunMs] | @tsv' 2>/dev/null \
  | awk 'BEGIN{FS="\t"}
         {for(i=1;i<=7;i++){if($i!=""){s[i]+=$i;n[i]++}} runs++}
         END{
           if(runs==0){print "  (no timing samples found)"; exit}
           printf "  samples              : %d runs\n", runs
           printf "  -- provisioning --\n"
           printf "  flow bundle download : %.1f ms\n", (n[1]?s[1]/n[1]:0)
           printf "  pieces install       : %.1f ms\n", (n[2]?s[2]/n[2]:0)
           printf "  engine install       : %.1f ms  (V8-cached)\n", (n[3]?s[3]/n[3]:0)
           printf "  provision (total)    : %.1f ms\n", (n[4]?s[4]/n[4]:0)
           printf "  -- engine execution timeline --\n"
           printf "  sandbox start (boot) : %.1f ms  (fork + Node + parse + isolated-vm init + connect)\n", (n[6]?s[6]/n[6]:0)
           printf "  sandbox run (flow)   : %.1f ms  (webhook -> math -> code -> response)\n", (n[7]?s[7]/n[7]:0)
           printf "  execution (total)    : %.1f ms\n", (n[5]?s[5]/n[5]:0)
         }'

echo ""
echo "=== SUMMARY ==="
echo "Model: worker-is-the-sandbox on GKE | $CLUSTER | workers=${WORKERS_READY} @ ${WORKER_CPU}/1G | concurrency=1 | REUSE_SANDBOX=${REUSE_SANDBOX} | clean-cache=${CLEAN_CACHE} | SANDBOX_CODE_ONLY | S3=GCS-europe-west1+signed-urls"
echo "Cold boot latency : ${COLD_MS} ms"
echo -n "Warm throughput   : "; awk '/Requests\/sec/{print $2" req/s"}' /tmp/hey-gke.txt
awk '/Total:|Average:|Slowest:|Fastest:/{print "  "$0}' /tmp/hey-gke.txt
echo ""
echo "Teardown when done:  kubectl delete -f benchmark/k8s-sandbox.yaml   (workload)"
echo "                     gcloud container clusters delete $CLUSTER --zone $ZONE   (cluster)"
