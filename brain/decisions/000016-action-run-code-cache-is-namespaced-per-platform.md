---
status: proposed
---

# Action-run code caches are namespaced per platform, and swept on a TTL

## Decision
An action run's compiled code step lands in `<cache>/v12/codes/ar_<platformId>_<sha256(sourceCode)>/<stepName>/`,
built by `actionRunCache.namespace`. The `ar_` prefix and the `platformId` are both load-bearing: the prefix
is the only thing distinguishing an action-run build from a flow-version build on disk, and the `platformId`
is what stops two customers sharing a directory.

Those directories are reclaimed by `actionRunCache.sweep` — a worker-local pass every 30 minutes that
deletes `ar_*` untouched for 24h, then evicts oldest-first if the `ar_*` subtree still exceeds 2 GB. Flow
version caches are explicitly **not** swept. Both knobs are hardcoded constants, not env vars.

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

**A flat segment, not a directory level.** `codes/<platformId>/<hash>/` would mean threading `platformId`
into the process maker — in fork mode `AP_BASE_CODE_DIRECTORY` is fixed at `getProcessMaker` time, before
`platformId` is known — and changing the engine's read path. A flat name leaves `codeCache.stepDir`,
`buildCodeMount`, `assertSafePathSegment` and `code-executor` untouched.

**30 minutes and 24 hours are different knobs and must not be collapsed.** The sweep is a `readdir`, a `stat`
per `ar_*`, and a size walk of survivors, on an `unref`'d timer — near-free, and tighter intervals already
exist in `worker.ts` (30s watchdog, 15s sandbox sampling). What the interval buys is *overshoot*: the size
backstop exists because a burst of large-dependency snippets can fill a disk inside one TTL window, so its
entire value is response time. A weekly sweep would leave a disk over budget for seven days. The TTL is
short because action-run code is agent-generated — repeats come from within a session, so 24h→7d costs ~7×
disk for near-zero hit-rate gain while leaving a week of tenant code on shared disk.

## Consequences
**A cache hit must now verify `index.js` exists.** `cacheState`'s memo is module-scoped with no invalidation
API, and a hit returns without touching disk — so deleting a directory would otherwise leave a permanent
phantom hit and an engine `require` of a missing file. It cannot be fixed with process-local invalidation:
the reference `docker-compose.yml` shares one `./cache` bind mount across `app` and five `worker` replicas.
Every sweep operation is correspondingly `force: true`, ENOENT-tolerant, and re-`stat`s before deleting.

**The sweep is race-free only because `provision` touches the mtime.** `localExecutionCache.provision` runs
immediately before `sandbox.start()`, so a bind-mounted directory was touched under ~130s ago — far inside
any TTL above an hour. Remove the touch and the TTL becomes a time bomb.

**The rename orphans older builds.** Bare-`sha256` directories and the single `mcp-flow-version-id` directory
are recognised and deleted by the sweep. Era-1 directories, named after real `apId`s, are indistinguishable
from live flow-version caches and are **not** reclaimable — better to leak them than to risk a heuristic that
eats a flow's cache.

Reversing this means changing an on-disk layout that the namer, the sweeper's filter, the isolate mount and
the engine's read path all agree on — which is what makes it expensive to undo.

General rule this sets: **a cache directory on shared infrastructure carries the id of the tenant that owns
it, and anything content-addressed carries an explicit reclamation policy** — because content-addressing
removes the collision that would otherwise have bounded it.

Related: [[action-run]], [[gotcha-code-cache-is-namespaced-by-flowversionid-never-reuse-a-constant]].
