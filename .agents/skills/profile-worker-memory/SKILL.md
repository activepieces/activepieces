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

**Don't wait for `oom_kill` to confirm a fix failed — read `max` in `/sys/fs/cgroup/memory.events`.** It counts how many times the cgroup hit `memory.max`, and it climbs long before anything dies: a container parked at the ceiling shows `max` rising by ~80/min while `oom_kill` stays 0, because the kernel is buying time by evicting page cache. Measured Aug 2026 on a reuse worker holding 791 MB of engine in a 1 GiB cgroup — `max` went 207 → 367 in two minutes with zero kills, and container `anon` even *fell* as file pages were reclaimed. So on a freshly-deployed fleet, `oom_kill=0` plus a climbing `max` means "about to die", not "fixed". Ignore `max` on a container in its first minutes, though — pulling a fresh piece cache pegs it for reasons that have nothing to do with a leak.

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

Two mechanics cost an hour each if you learn them the hard way:

- **The engine process is renamed `sandbox-<nanoid>`.** Matching on `/usr/local/bin/node` finds the *code-step* child (~45 MB, its own module registry, `require.cache` of size 1) and tells you nothing about the pieces. Match `sandbox-*` in `/proc/<pid>/cmdline`. `ps` is not in the image; walk `/proc` directly.
- **Node's global `WebSocket` cannot talk to the V8 inspector** — the handshake is accepted, then the socket dies with a bare error. Use the `ws` the image already ships: `find /usr/src/app/node_modules -type d -name ws -path "*node_modules/ws"`, and pass `{ perMessageDeflate: false, maxPayload: 0 }`.

Send `SIGUSR1` to open the inspector, then drive CDP over `127.0.0.1:9229`:

```js
process.kill(pid, 'SIGUSR1')                       // opens inspector
// GET /json/list -> webSocketDebuggerUrl, then over the socket:
//   HeapProfiler.enable
//   HeapProfiler.collectGarbage      <- so you profile survivors, not garbage
//   HeapProfiler.takeHeapSnapshot
// stream HeapProfiler.addHeapSnapshotChunk events to a file
```

`collectGarbage` first is load-bearing: without it the histogram is full of collectable junk and the real retainers are buried.

### When you only need *identity*, don't snapshot at all

A full snapshot of a ~950 MB heap kills the process mid-serialization (the cgroup can be raised; `--max-old-space-size` cannot — see the Gotchas on [[workers]]). If the question is "which modules are resident" rather than "who retains this", one `Runtime.evaluate` answers it for a few KB and cannot OOM anything:

```js
// returnByValue: true, includeCommandLineAPI: true
const cache = process.mainModule.constructor._cache
const keys = Object.keys(cache)
// → totalModules, count matching @activepieces/shared, pieces-framework,
//   distinct @activepieces/piece-* packages, and process.memoryUsage()
```

Run it against the `sandbox-<id>` pid while a flow holds the sandbox open. To *get* that window, end the probe flow with a CODE step that sleeps — a `delay` piece step over 10 s creates a waitpoint and **pauses the run**, releasing the sandbox, so the process you wanted is gone before you arrive.

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

## Four ways this investigation goes wrong — all four cost a full round in Aug 2026

- **Reachability is not attribution. Report the *dominated* size.** "N% of the heap is reachable from X" is near-vacuous for any X near the module graph — `Module._cache` sits one hop from every module scope, so it, `global`, and most single modules' exports all score 99%+ on a *healthy* process. The number that answers "what do I free by dropping this" is the exclusively-dominated size, and the two can disagree wildly: the same snapshot read 99.8% reachable and **0.1 MB dominated**. Quote the second. Anyone who has run the first measurement will discount your whole memo when they see it.
- **A cross-section of different tenants cannot separate module data from run data — only the same pid over time can.** Module *count* predicted heap at r=+0.06 across 15 engines while source *bytes* managed +0.64, and heap-per-module spanned 22–184 KB. Worse, those 15 were four tenant clusters, so the effective n is ~5 and no correlation there is interpretable. If the question is "is it accumulating", take two snapshots of one pid N runs apart and diff by dominator. Also force a GC (`HeapProfiler.collectGarbage`) before *every* `heapUsed` read, not just before snapshots — otherwise the number is retained memory plus whatever garbage recent traffic left.
- **Verify effective config from the live process, never from container env.** `SANDBOX_MEMORY_LIMIT` is not a `WorkerSystemProp`; the worker's own `AP_SANDBOX_MEMORY_LIMIT` is dead config, and the real value arrives from the app over the settings socket. `docker inspect` on a worker "proves" nothing. Read `process.execArgv` and `v8.getHeapStatistics().heap_size_limit` over the CDP session you already have — and not `/proc/<pid>/cmdline`, which `process.title` has overwritten.
- **Read the kernel's `Tasks state` table, not just the `Killed process` line.** When a cgroup is blown by the *sum* of several processes, the kill line names whichever single task had the highest RSS — so a 285 MB victim can hide a 984 MB total and the container looks like it died under its limit. The table lists every task with `rss_anon` in pages; sum it. The tell for a sum rather than a leak is that no process is near its own ceiling.

- **Neither `oom_kill` nor a raw `dmesg` count is a kill total — one resets, the other rotates.** The cgroup `memory.events` counter lives with the container and **resets on recreation**, so anything that recycles containers zeroes your evidence: measured Aug 2026, a fleet whose containers were being bulk-restarted read `oom_kill=0..2` per host while `dmesg` showed ~48 kills in 40 minutes on the same host. And `dmesg` under-counts in the opposite way, because every OOM prints a full `Tasks state` table, so a host that is OOMing hard rotates its ring buffer in **tens of minutes** — four hosts all reporting exactly `48` is the buffer cap, not a coincidence. Always compute the buffer's own window (`dmesg -T | head -1` vs `tail -1`) and quote a **rate over that window**, flagged as a floor. Cross-check with `RestartCount`, and check the *exit code* before calling a restart an OOM: `exit=0` is the SIGTERM path (`main.ts`), i.e. somebody ran `docker restart`, not the kernel.

And a trap in your own instrumentation: a shell probe matching `case "$cl" in *bootstrap.js*)` also matches **the probe's own command line**, silently overwriting the worker's RSS with the shell's 1 MB. Same family as grepping heap strings and finding your own source. Prefer `/proc/1` for the worker (node is PID 1 since pm2 was removed) and match engines on `comm` = `sandbox-*`.

## Redact before you publish the findings

The snapshot never leaves the box — but **its output carries the same data in miniature**. Constructor histograms and retainer paths are full of real `flowVersionId`s, and a retained string's preview can expose flow names, step config, and timestamps. Replace them with placeholders (`<flow-version-a>`) before they go into a PR description, an issue, a Slack message, or a doc. This repo's PRs are public. Getting this right at the snapshot step and then pasting the raw histogram into a public PR undoes the whole point.

## Clean up

Remove the snapshot (it is large and it is sensitive), the helper scripts, and confirm every cgroup limit you touched is back to its original value.
