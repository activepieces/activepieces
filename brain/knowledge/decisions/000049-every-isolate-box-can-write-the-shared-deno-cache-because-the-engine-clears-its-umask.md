---
title: Every isolate box can write the shared deno cache because the engine clears its umask
icon: 🔓
status: accepted
---

# Every isolate box can write the shared deno cache because the engine clears its umask

## Decision

When the sandbox layer reports that the per-flow-version deno cache is mounted (`AP_DENO_CACHE_MOUNTED=true`, which only happens inside an isolate box), the engine sets its umask to `0` before spawning deno. Deno inherits it and creates every directory under `.deno-cache` as `0777`, so any box can add entries for any step. Nothing on the worker side walks or re-permissions the tree.

## Context

The cache is shared per flow version (see 000048), but each isolate box id runs as its own UID (`60000 + boxId`), and the ids are a fixed pool that is reused across jobs. Deno creates its `gen/file/root/codes/<flowVersionId>/<step>/` directories as `0755` owned by whichever UID touches them first. A single run executes all its steps in one box, so the first run fills every step it reaches on one box and the files it leaves are readable by every other box, which is why a linear flow goes warm everywhere.

A step the first run never reached, such as the other branch of a router, a step after a continue-on-failure, or a loop body with nothing to iterate, is first executed later on whatever box the job lands on. That box has to create `<flowVersionId>/<step>/` inside a directory owned by another UID and cannot, so deno re-transpiles in memory on every run of that step until the owning box happens to execute it. Measured on the preview: 230 ms per run on the non-owner box against 70 ms once cached. The box dying does not help, because ownership belongs to the UID, which comes back with the box id.

## Why

Ownership cannot be handed over cheaply after the fact. The worker could `chmod` the tree as root once a box exits, but the cache is shared with other boxes that may still be writing it, so that is a privileged walk over tenant-writable content, the symlink race that was already rejected once. It is also a full tree walk per run, including the npm cache, and it leaves a window in which new entries are owner-only again.

Clearing the umask fixes the modes at creation time instead, with no walk, no root involvement and no window. The widening is confined to the box: the engine there writes only to the per-box scratch mount, wiped on every job, and to this cache, which is scoped to one flow version by the mount and already treated as a single trust boundary. A tenant's other flows are not mounted into the box at all, so wider modes cannot reach them.

Measured with the same two-steps-two-UIDs experiment: the first non-owner run of a never-cached step dropped from 230 ms to 69 ms, and a third box read both steps warm. Deno's SQLite files stay `0644` because SQLite sets that mode itself, and that is fine, since a box only reads them to use a cached step; pre-seeding them as `0666` changed nothing.

## Consequences

`resolveWarmDenoDir` in `deno-code-sandbox.ts` calls `process.umask(0)` whenever the mount flag is set, and a test asserts the `gen` directory deno creates is `0777`. The forked modes never set the flag, so the host engine keeps its umask. Deno does not re-permission an existing directory, so a cache created before this change keeps its `0755` directories until it is removed; that only matters for a cache filled by an older worker build. Any box can now also replace another box's entries for the same flow version, which the rw mount already allowed at the root.
