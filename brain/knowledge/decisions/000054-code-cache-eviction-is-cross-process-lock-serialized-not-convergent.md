---
status: accepted
---

# Code cache eviction is cross-process lock-serialized, not convergent

## Decision
`action-run-cache.ts` and `flow/code/code-cache-eviction.ts` are merged into one module,
`packages/server/sandbox/src/lib/cache/code-cache-eviction.ts`. Reclamation now goes through a real
cross-process lock (`diskLock`, a file-based mutex in `<cache>/vNN/code-cache-locks/`) instead of the
convergent, lock-free design 000016 shipped: provisioning (`localExecutionCache.installCodeStep` →
`codeCacheEviction.withDirLock`) and eviction (`removeDir`'s 0-timeout try-lock) now contend on the
same per-directory key, replacing the in-process `pendingRemovals` / `settlePendingRemoval` mtime
handshake, which is deleted outright.

The sweep also grew a second pass: **flow-version code caches, previously never reclaimed at all, are
now evicted under disk pressure** (`sweepOnDiskPressure`, triggered once the cache volume crosses 80%
used), oldest-mtime-first, through the same per-directory lock. The original action-run TTL + count-cap
sweep (000016) is unchanged in its own right and runs as the first pass of the same `sweep()` call.

## Context
000016 built a convergent sweep deliberately, because a worker has no Redis and therefore no
`distributedLock` (see `workers.md` § Gotchas) — so "don't coordinate, make every step idempotent and
safe to run N times at once" was the only available shape, and it worked for its one narrow case:
action-run directories, bounded by a 2h TTL and a 200-dir cap, where the in-process
`pendingRemovals`/`settlePendingRemoval` handshake closed the one-sweep race between a touch and an
in-flight `rm`.

Extending eviction to flow-version caches broke that assumption. A flow-version cache has no TTL and no
count cap — its only "is this still wanted" signal is mtime plus an active-execution window, exactly
like an action-run directory, but it is reached by a **different trigger** (disk usage, not elapsed
time), its candidate set churns across `readdir` calls, and the convergent handshake was never designed
to survive two containers racing on the *same* volume — the handshake lives in one process's memory,
useless the moment the other container is the one deleting.

## Why
**`diskLock` is file-based, not Redis.** It satisfies the same constraint 000016's "convergent" choice
was working around (no Redis on a worker) by a narrower route: lock state lives on the same disk every
container sharing the volume already reads, keyed per directory, so contention is local to the one path
two processes actually disagree about — not a fleet-wide mutex.

**A provision holds its lock for up to 15 minutes (a cold `bun install`); eviction only ever tries for
0.** Eviction never blocks a build, and a build never waits on eviction either — a candidate under an
active lock is just marked `skipped` and retried next cycle. This is the same "never block the hot
path" property the old mtime handshake had, just enforced by a real mutex instead of a best-effort
in-process map.

**A second, fleet-wide lock serializes the *scan* itself, separately from per-directory data safety.**
Every container sharing a volume runs its own 30-minute sweep timer, so a host-wide container restart
makes many of them wake up and want to `readdir`/`stat` the same tens-of-thousands-of-directory tree at
once — a stampede that per-directory locking does nothing for, since the expensive part is the *scan*,
not the deletion. `sweepOnDiskPressure` now wraps its whole scan-and-evict body in one more try-lock on
a single fixed key; the container that loses just skips the cycle (debug-logged, not a failure).

**Action-run candidates get a longer pressure-eviction floor than the generic active window.**
`markUsed` (the renamed `touch`) fires at code-install time, but queueing, engine/piece installs and the
run itself all happen after that touch — with the window exactly equal to the run budget there is zero
margin, so a pressure sweep could delete a namespace an in-flight run is about to execute from.
Action-run pressure candidates use `max(1h, activeWindowMs + the 15-minute provision-lock budget)`
instead of the plain active window flow-version candidates use.

Deletions also pace themselves — a 1-second pause every 10 removals, re-checking disk usage at each
checkpoint — so a large purge on a host over threshold doesn't run as one unbroken CPU/IO-bound loop
across a disk every other container on the host is also using.

**A `diskLock` try-lock (timeout 0) deliberately still fails after cleaning up a stale lock file, rather
than entering immediately** — see 000055, the one piece of this redesign sharp enough to warrant its
own record.

## Consequences
`pendingRemovals`/`settlePendingRemoval` and the file they lived in are gone; nothing calls them.
`actionRunCache` shrinks to pure namespace identity (`namespace`, `isActionRunNamespace`); `touch` is
renamed `codeCacheEviction.markUsed` and used by both namespace kinds, since the activity signal now has
one owner regardless of which pass reads it.

A build now pays real lock I/O on every provision, including a cache hit — a short-poll-backed cost
(25ms doubling to 500ms), accepted because removing the lock on "fast" paths would re-open exactly the
TOCTOU window a lock exists to close.

Supersedes 000016's "no lock, must be convergent" architecture for the code-cache subsystem as a whole;
000016's narrower facts (platform namespacing, the 2h TTL, the 200-dir cap, the `action-runs/` directory
level) are unchanged and still govern the action-run TTL pass.

Related: [[action-run]], [[workers]], 000016, 000055.
