---
status: accepted
---

# A disk-lock try-lock still fails right after it clears a stale lock

## Decision
`diskLock.acquire(key, timeoutMs)`'s stale-lock takeover (a lock file untouched for 5 minutes gets
renamed away and deleted) does **not** let a 0-timeout try-lock proceed on the same attempt. Only a
*waiting* acquire (`timeoutMs > 0`) retries immediately after a takeover — once per acquire, and only
while its deadline still allows it. A try-lock still throws `DiskLockTimeoutError` even though it just
proved the previous holder's lock file was stale.

## Context
The lock's only liveness signal is a 60-second heartbeat touching the lock file's mtime. A file untouched
for 5 minutes means the heartbeat stopped — almost always because the holder process died, but not
always: a holder whose event loop is blocked (a pathological sync compile, a CPU-starved container) also
stops heartbeating while the process is still alive, and will resume once unblocked.

## Why
Eviction's per-directory removal (`removeDir`) is exactly this kind of try-lock. If it entered the
critical section the moment it saw a stale-looking lock, a provisioning build that is merely frozen —
not dead — would have its directory `rm -rf`'d out from under it the instant it resumes, and the
resumed build would keep writing into a deleted tree. Keeping the fail-fast behavior on try-locks costs
one sweep cycle (≤30 min) of delay reclaiming a *genuinely* dead holder's directory — a bounded,
logged (`skippedCount`) cost, chosen over a correctness hole with no bound at all.

A *waiting* acquire is a different risk profile: it is already committed to blocking for the resource
(provisioning budgets 15 minutes), so retrying immediately after confirming staleness is a pure win —
without it, a waiter would sit through a full poll cycle for no reason after already doing the work of
proving the old holder is gone. The retry is capped at once per acquire and deadline-gated specifically
because an unconditional retry is a livelock on a filesystem whose clock lags the callers' by more than
the staleness window — every fresh lock file would misread as stale forever.

## Consequences
A crashed-mid-build host's orphaned step directory is reclaimed one sweep cycle later than the moment
its lock is provably stale, not immediately — accepted, since the alternative risks deleting a live
build. See 000054 for where this sits in the broader eviction redesign.

Related: 000054.
