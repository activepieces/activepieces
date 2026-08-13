---
name: profile-worker-memory
description: "Diagnose a worker that is growing memory or being OOM-killed: separate a JS-heap leak from native growth, take a V8 heap snapshot of a live worker in place (never uploading it), and walk the retainer path back to the code that holds the memory. Use when a self-hoster reports 'memory correlates with pod age', workers restart on their own, or a container sits near its limit."
---

# Profile a Leaking Worker

**Never ask anyone to upload a heap snapshot.** It contains connection tokens, API keys, and customer step data verbatim — a customer will refuse, and they are right to. This procedure keeps the snapshot on their box and moves only an aggregate histogram off it. That is the difference between an investigation that stalls and one that closes.

Every command below runs over SSH against the worker host.

## 1. Confirm it is actually OOM, and find what is dying

A worker under pm2 dies and restarts without the container ever leaving `Up`, so `docker ps` and `docker stats` both look calm. The real tells:

```bash
docker inspect <container> --format '{{.State.OOMKilled}}|{{.RestartCount}}'
docker exec <container> pm2 list          # the ↺ column is the crash count
dmesg -T | grep -aiE "Memory cgroup out of memory|Killed process"
```

`OOMKilled=true` on a *running* container means the cgroup OOM-killed a child while PID 1 survived. In `dmesg`, the process name is truncated to **15 characters**: `node /usr/src/a` is the **worker** (`…/worker/dist/src/bootstrap.js`), not the engine — the engine runs as `/usr/local/bin/node`. Getting this backwards sends you profiling the wrong process.

## 2. JS heap or native? Decide before you snapshot

```bash
docker exec <c> pm2 jlist   # pm2_env.axm_monitor["Used Heap Size"]
docker exec <c> cat /proc/<pid>/smaps_rollup
```

Compare `Used Heap Size` against `Rss`. Worker baseline is roughly **heap + ~100 MB flat**. If RSS grows and heap grows with it, it is a JS heap leak — continue. If RSS grows while heap stays flat, it is native (isolated-vm, buffers, addons) and a heap snapshot will show you nothing.

Sample across all containers on the host before picking a target; snapshot the one with the largest heap.

## 3. Snapshot in place

Raise the cgroup first — serializing the heap allocates, and a 1 GiB container will OOM mid-snapshot. **Restore it afterwards and verify.**

```bash
docker update --memory 6g --memory-swap 6g <container>
# ... snapshot ...
docker update --memory 1g --memory-swap 1g <container>
docker inspect <container> --format '{{.HostConfig.Memory}}'   # confirm restored
```

Node 24 has a global `WebSocket`, so a snapshot needs no dependencies. Send `SIGUSR1` to open the inspector, then drive CDP over `127.0.0.1:9229`:

```js
process.kill(pid, 'SIGUSR1')                       // opens inspector
// GET /json/list -> webSocketDebuggerUrl, then over the socket:
//   HeapProfiler.enable
//   HeapProfiler.collectGarbage      <- so you profile survivors, not garbage
//   HeapProfiler.takeHeapSnapshot
// stream HeapProfiler.addHeapSnapshotChunk events to a file
```

`collectGarbage` first is load-bearing: without it the histogram is full of collectable junk and the real retainers are buried.

## 4. Parse it off the worker process

Never parse the snapshot inside the constrained container. `docker cp` it out and run the parser in a throwaway fat container using the same image:

```bash
docker run --rm --memory 10g -v /tmp:/data --entrypoint node <image> \
  --max-old-space-size=8192 /data/parse.js /data/heap.heapsnapshot
```

The format is flat typed arrays described by `snapshot.meta`: read `node_fields` for the stride, then walk `nodes` summing `self_size` grouped by `strings[name]`. That histogram alone usually names the leak.

## 5. Walk the retainer path — this is the answer

A histogram tells you *what* is retained; only the retainer path tells you *who* holds it, which is the line of code you fix. Build `firstEdge` as a prefix sum over each node's `edge_count`, BFS from node 0 recording a parent per node, then walk parents back from the offending node. Print the **edge names** — the property names on the path are the variable names in the source.

The 2026-08 worker leak resolved to exactly this, and the last two edges were the whole diagnosis:

```
Object
  property:/usr/src/app/cache/v13/bundles/<flowVersionId> -> Object
  property:<flowVersionId> -> string "{\"flowVersion\":…"   [90 MB]
```

A module-level object keyed by cache path, holding whole flow-bundle manifests, never evicted (`cache-state.ts`). See the Gotchas on [[workers]].

## Redact before you publish the findings

The snapshot never leaves the box — but **its output carries the same data in miniature**. Constructor histograms and retainer paths are full of real `flowVersionId`s, and a retained string's preview can expose flow names, step config, and timestamps. Replace them with placeholders (`<flow-version-a>`) before they go into a PR description, an issue, a Slack message, or a doc. This repo's PRs are public. Getting this right at the snapshot step and then pasting the raw histogram into a public PR undoes the whole point.

## Clean up

Remove the snapshot (it is large and it is sensitive), the helper scripts, and confirm every cgroup limit you touched is back to its original value.
