---
status: proposed
---

# Action-run code caches live in their own directory, namespaced per platform, and swept on a TTL

## Decision
An action run's compiled code step lands in
`<cache>/v12/codes/action-runs/<platformId>_<sha256(sourceCode)>/<stepName>/`, built by
`actionRunCache.namespace`. The `action-runs/` directory level and the `platformId` are both load-bearing:
the directory is what distinguishes an action-run build from a flow-version build on disk, and the
`platformId` is what stops two customers sharing a directory. Flow-version caches stay at the root of
`codes/`, unmoved.

Those directories are reclaimed by `actionRunCache.sweep` — a worker-local pass every 30 minutes that
reads **only** `codes/action-runs/`, deletes children untouched for 2h, then evicts oldest-first while more
than `ACTION_RUN_CACHE_MAX_DIRS` (200) survivors remain, never touching one whose mtime is inside
`ACTION_RUN_CACHE_ACTIVE_WINDOW_MS` (15 min). Reclamation is bounded by directory **count**, never by
bytes. Flow version caches are explicitly **not** swept, and are now structurally unreachable by the sweep
rather than merely excluded by a filter. All four knobs are hardcoded constants, not env vars.

## Context
The code cache is keyed by `flowVersionId` + step name and nothing else, and an action run has no flow
version. Three schemes have been tried:

1. **A real, throwaway `flowVersion.id`** (the pre-branch temporary-flow path). The flow row was deleted;
   the directory was not. One leaked directory per `ap_run_code` call, named after a UUID that could never
   be traced back to a tenant.
2. **The constant `DEFAULT_MCP_DATA.flowVersionId`.** Every action run compiled into one directory. Because
   a different snippet was always a hash miss and `installFn` opens by `rm -rf`-ing the directory, the
   destructive rebuild *was* the garbage collection — bounded at O(1) dirs. It was also the bug: `memoryLock`
   serialises the build but not the later read of `index.js`, so concurrent boxes could execute each other's
   snippet, and a nil `provision.flowVersionId` made `buildCodeMount` return `null`, leaving nothing mounted
   at `/root/codes` in isolate mode.
3. **`sha256(sourceCode)`.** Fixed both, precisely by making the rm-and-rebuild branch unreachable — which
   is how the only reclamation on this path disappeared. It left a globally shared, content-addressed cache
   with unbounded growth.

## Why
Content-addressing is not a confidentiality leak — a tenant only ever reads an artifact compiled from source
it supplied itself, and isolate bind-mounts are read-only. Four other things were wrong with it:

- **No tenant attribution.** A directory belonged to nobody, so a customer's compiled code could not be
  purged on request, disk could not be attributed, and "is our code on shared infrastructure?" had no answer.
- **A cross-tenant existence oracle.** Cold build is `bun install` + esbuild (seconds), warm hit is
  milliseconds — enough to probe whether anyone else has run a byte-identical snippet.
- **Shared dependency resolution.** `bun install` over unpinned semver means the artifact is not a pure
  function of the source; one tenant's months-old resolution of `^4.0.0` was served to another.
- **House rule.** `custom_pieces/<platformId>`, built two lines away in the same function, already namespaces
  by platform. This did not.

**Platform, not project.** A platform is the customer boundary, matching the `custom_pieces` precedent, and
it keeps the cache warm across a customer's own projects. Purging a customer is then one glob.

**A constant directory level, not a variable one, and not a name prefix.** The first shape of this
decision used a flat `ar_<platformId>_<hash>` segment, on the grounds that a directory level would mean
threading `platformId` into the process maker — in fork mode `AP_BASE_CODE_DIRECTORY` is fixed at
`getProcessMaker` time, before `platformId` is known — and changing the engine's read path. That objection
is real but applies only to a **variable** first level like `codes/<platformId>/<hash>/`. `action-runs/` is
a **constant**, so the base code directory stays `/root/codes`, both process makers are untouched, and
`code-executor`'s `${baseCodeDirectory}/${flowVersionId}/${stepName}/index.js` absorbs the extra segment by
string interpolation with no change at all. The `platformId` stays flat *inside* that directory: a
per-platform level would make the sweeper walk two levels and assemble its eviction list across platforms,
which is the one place this design insists on recomputing from a single live `readdir`, and it would leave
empty platform directories whose pruning races peer replicas creating them. Per-tenant purge stays a glob.

**The nesting cannot be hidden from the engine.** The tempting version is host-side only — keep the
directory at `codes/action-runs/<ns>` but mount it back to `/root/codes/<ns>` so the namespace the engine
holds stays a single segment. That works in isolate mode and breaks in fork mode, where
`AP_BASE_CODE_DIRECTORY` is the real host `codes/` path with no mount indirection and the engine reads
`<codes>/<namespace>/<stepName>/index.js` straight off the host filesystem. The namespace string the engine
receives must therefore literally contain `action-runs/`, which is why `assertSafePathSegment` could no
longer gate it alone.

**The guard was extended by composition, not by loosening.** `assertSafePathSegment` is unchanged and still
rejects `.`, `..`, any `..` substring, `/`, `\`, NUL and empty. `assertSafeCodeNamespace` splits on `/`,
rejects more than two segments, and runs every segment through that untouched guard — so a value that
becomes a bind-mount `hostPath` gains a legal second level without the traversal rules being restated or
weakened anywhere. Generic depth-2 rather than a whitelist of the two known shapes was chosen knowingly:
the residual is that a future caller could park a namespace one level deep somewhere unintended, which is a
correctness surprise rather than an escape, and every segment is still individually asserted.

**A count cap, not a byte budget — a byte budget was tried and removed.** The obvious backstop is "evict
while the subtree exceeds N bytes", and it is wrong twice. First, the premise: a burst of
large-dependency snippets cannot fill a disk, because `code-builder` deletes `node_modules`
unconditionally after compile *and* on install failure — an action-run directory is the esbuild bundle, not the
dependency tree, so reaching gigabytes needs thousands of distinct snippets inside one TTL window. The
2 GiB budget it shipped with was also the size of the *entire* default Helm volume (`persistence.size:
2Gi`, which also carries the engine, `pieces-metadata`, flow caches and bundles), so it could never fire.

Second, and the reason not to simply retune it: **a byte budget cannot bound the number of survivors, and
the number is what safety depends on.** At any instant some directories are bind-mounted into running
sandboxes, and deleting one fails that run. A count cap holds a fixed floor of `N` newest directories
whatever they weigh; a byte budget's survivor count moves with their size, so at 0.5 GB each a 2 GB budget
permits four survivors — fewer than the live set on any real topology, which means it *must* evict into it.
That is the difference between a policy that can be made safe and one that cannot be.

**The cap alone is not the safety mechanism, though, because mtime order is provision order, not liveness
order.** A directory's mtime is when `provision` touched it and is never refreshed for the ≤120s the run
lasts, so a long-running action run is outranked by every shorter one that started after it — "the newest
200" is not "the live ones". Eviction reaching a live directory needs only `ACTION_RUN_CACHE_MAX_DIRS` distinct
snippets provisioned inside one execution window (~1.7/s sustained), which is reachable at cloud scale
rather than exotic. What closes it is an explicit skip: **eviction ignores any directory whose mtime is
inside `ACTION_RUN_CACHE_ACTIVE_WINDOW_MS`**, set at 15 minutes because provision itself can run minutes on a cold
`bun install`. The failure that trades into is the safe one — when everything is inside the window the tree
is left above the cap until it ages out, so disk overshoots instead of a run dying. That case still logs,
carrying `activeCount`, so a permanently blocked eviction is never silent.

**`ACTION_RUN_CACHE_MAX_DIRS` should still exceed `AP_WORKER_CONCURRENCY` × replicas sharing the mount** — 25 on the
reference topology (`replicas: 5`, configs.ts concurrency default 5) against a cap of 200, an 8× margin. That
is now a *utilization* invariant rather than a safety one: below it the active-window skip blocks every
eviction and the cap stops holding. ADR 0002 pushes operators *down* on concurrency rather than up, since at
>1 an OOM takes out all in-flight jobs, so realistic values stay far below the cap.

**30 minutes and 2 hours are different knobs and must not be collapsed.** The sweep is a `readdir` and one
`stat` per entry on an `unref`'d timer — cheaper than when the interval was chosen, both because the recursive
size walk went with the byte budget and because the `readdir` now returns only action-run directories rather
than every flow-version cache on the worker — and tighter intervals already exist in `worker.ts` (30s watchdog,
15s sandbox sampling). What the interval buys is *residency* overshoot, not disk overshoot: at a 2h TTL a
30-minute pass means a directory lives 2h–2.5h, where a weekly pass would leave tenant code on shared disk
for a week. The TTL is short because action-run code is agent-generated — repeats come from within a
session, dominated by the batch path (`items[]` up to 100, one call per item, seconds to minutes) — so a
longer TTL buys near-zero hit rate for proportionally more residency.

**A process-local timer, not Redis, `distributedLock`, or a system job.** The obvious shape for "run this
every 30 minutes, once" is a system job on the shared `system-job-queue`, or a `distributedLock` so only one
replica sweeps. Neither is available here, for three independent reasons:

- **A dedicated worker has no Redis and cannot be given one cheaply.** `AP_CONTAINER_TYPE=WORKER` boots only
  `packages/server/worker` under PM2 — no Fastify app, no TypeORM connection, no Redis client anywhere in the
  process. `distributedLock` is defined in `packages/server/api/src/app/database/redis-connections.ts`, and
  `worker`'s `package.json` depends on `sandbox`, `server-utils`, `shared` and the `core-*` members — not on
  `api` — and carries neither `ioredis` nor `bullmq`. Reaching the lock means importing `api` from `worker`:
  the wrong direction in the dependency graph, and it drags Fastify, TypeORM and BullMQ into the worker
  bundle. This is already observed in production — workers carry no Redis env at all and reach the queue only
  through the app over Socket.IO ([[workers]]).
- **Redis in the worker would widen the trust boundary.** A worker's only credential is a scoped
  `AP_WORKER_TOKEN` over a socket, which is what lets one run on a machine not trusted with the platform's
  queue. Redis holds every queue and every lock for the whole deployment; handing that to each replica in
  order to schedule a `readdir` is not a trade worth making.
- **A system job is the wrong shape even where Redis is present.** `systemJobsSchedule(...).startWorker()` is
  called from `app.ts`, so handlers run in the *app* process, once cluster-wide. Action-run directories are
  per-worker local disk: the Helm chart's default `workloadType: rollout` mounts one `ReadWriteOnce` PVC into
  every replica, but `statefulset` gives each pod its own, and the app need not mount the worker volume at
  all. A once-cluster-wide handler in the app cannot `readdir` a worker pod's filesystem. Sweeping local disk
  has to run on the machine that owns the disk.

So the sweep is made **convergent instead of coordinated**: N sweepers over one shared mount is the steady
state, not an edge case, so every step is idempotent — `force: true`, ENOENT-tolerant, mtime re-checked
immediately before `rm` — and eviction recomputes its target set from the live `readdir` rather than
accumulating state across deletions. Two sweepers firing in the same millisecond select the same oldest set,
delete it once, and neither can evict past the cap. That property is what stands in for the lock, and it is a
second reason the byte accounting had to go: subtracting reclaimed bytes from a running total was the one part
of the sweep that *did* accumulate, so a peer deleting a directory first left the total uncredited and drove
that sweeper to keep evicting past its stopping point. Timer jitter is therefore unnecessary rather than
merely missing — simultaneous sweeps cost duplicated `stat` calls, nothing else.

## Consequences
**A cache hit must now verify `index.js` exists.** `cacheState`'s memo is module-scoped with no invalidation
API, and a hit returns without touching disk — so deleting a directory would otherwise leave a permanent
phantom hit and an engine `require` of a missing file. It cannot be fixed with process-local invalidation:
the reference `docker-compose.yml` shares one `./cache` bind mount across `app` and five `worker` replicas.
Every sweep operation is correspondingly `force: true`, ENOENT-tolerant, and re-`stat`s before deleting.

**The sweep is race-free only because `provision` touches the mtime.** `localExecutionCache.provision` runs
immediately before `sandbox.start()`, so a bind-mounted directory was touched under ~130s ago — far inside
any TTL above an hour, and inside the active window that eviction skips. Remove the touch and both controls
lose the only signal they have that a directory is in use. The touch is gated on
`isActionRunNamespace`, because `provision` runs on every execute and an ungated `utimes` charges every code step of
every flow run for a directory that is never swept.

**The mtime cannot close the last interleaving on its own, so removal and provision shake hands in-process.**
A removal whose re-`stat` has already passed cannot see a touch that lands a microsecond later: `rm` proceeds
under a sandbox that just decided the directory was a cache hit, and that run dies on a missing `index.js`.
The window is only as wide as one `rm`, but it is reachable — a cold snippet re-requested at the instant its
eviction starts. `removeDir` therefore records its in-flight `rm` in `pendingRemovals` in the same synchronous
block that starts it, and `provision` calls `settlePendingRemoval` *after* the touch: a removal registered
after the touch is impossible, because its re-`stat` sees the new mtime and skips; one registered before is
awaited, then the step is rebuilt. Those two cases are exhaustive only because nothing can interleave between
the re-`stat` resolving and the `Map.set` — keep the write before the first `await`, never after the `rm`
resolves. The handshake is process-local, so two worker processes over one shared mount still fall back to the
mtime re-check alone; that is accepted, the same way the sweep is convergent rather than locked.

**The discriminator is structural, which is why the earlier `ar_` prefix was retired.** A prefix made
classification lexical, and it was collision-proof only because `ALPHABET` in `core-utils/id-generator.ts`
is `[0-9A-Za-z]`: no `apId` can start with `ar_`, so no flow-version directory could be classified as
managed. Adding `_` to that alphabet would have misclassified any id beginning `ar_` — roughly one in
238 000 per id, so effectively certain at cloud scale — and the sweeper would have started eating flow
caches silently, from a one-character change three packages away with no test between it and data loss.
Length could not help: `platformId` and `flowVersionId` are both 21-char `apId`s.

A directory does not remove that class of coupling so much as collapse its probability. A flow-version
directory can now only be swept if it lands *inside* `codes/action-runs/`, which requires a `flowVersionId`
equal to the string `action-runs` — needing `ALPHABET` to gain `-`, **and** `ID_LENGTH` to go from 21 to 11,
**and** the `ApId` regex to change, all together. The sweep also no longer filters by name at all: it reads
only its own directory, so nothing at the root of `codes/` is a candidate however old. A test pins that a
flow-version directory, a leftover `ar_`-prefixed directory and a stray file at the root of `codes/` all
survive a sweep of arbitrarily aged entries, and a second pins that `ACTION_RUN_CODE_DIR` is not `apId`-shaped.

**Pre-`action-runs/` builds are deliberately left to leak.** Bare-`sha256`, `mcp-flow-version-id` and
`ar_`-prefixed directories only ever existed on machines that ran intermediate commits of the branch that
introduced this — none of these layouts ever reached `main`. Reclaiming them needs a name-sniffing branch
that, unlike the managed path, has no TTL and no mtime re-check, and would `rm -rf` `mcp-flow-version-id`
every 30 minutes the day anything did provision under that still-live constant. Era-1 directories, named
after real `apId`s, are indistinguishable from live flow-version caches and are likewise **not** reclaimable
— better to leak them than to risk a heuristic that eats a flow's cache. On a dev box that ran those
commits, `rm -rf cache/v12/codes` is the cleanup.

Reversing this means changing an on-disk layout that the namer, the sweeper's root, the isolate mount and
the engine's read path all agree on — which is what makes it expensive to undo.

General rule this sets: **a cache directory on shared infrastructure carries the id of the tenant that owns
it, and anything content-addressed carries an explicit reclamation policy** — because content-addressing
removes the collision that would otherwise have bounded it.

Second rule, from the byte budget: **when a reclamation policy runs against directories that are concurrently
in use, bound it by count and exempt an explicit in-use window — never by size, and never on recency alone.**
Only a count cap fixes how many entries survive, and "how many survive" is what decides whether eviction can
reach something a live process is reading; but recency is a proxy for liveness, not liveness itself, so the
window is what turns "unlikely to be reached" into "cannot be reached".

Related: [[action-run]], [[gotcha-code-cache-is-namespaced-by-flowversionid-never-reuse-a-constant]].
