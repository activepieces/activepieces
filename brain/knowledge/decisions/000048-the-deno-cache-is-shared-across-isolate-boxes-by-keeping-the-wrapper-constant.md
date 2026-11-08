---
title: The deno cache is shared across isolate boxes by keeping the wrapper constant
icon: 🔥
status: accepted
---

# The deno cache is shared across isolate boxes by keeping the wrapper constant

## Decision

Every deno code step of a flow version shares one `DENO_DIR` at `<codes>/<flowVersionId>/.deno-cache`. In the isolate modes (`SANDBOX_PROCESS`, `SANDBOX_CODE_AND_PROCESS`) the worker creates that directory with mode `0777`, mounts it `:rw` under the read-only code mount and sets `AP_DENO_CACHE_MOUNTED=true`. Nothing else touches permissions: no recursive chmod, no per-box subdirectory. The sharing works because the stdin program that `deno.run` feeds to deno is byte-identical for a given step across runs: the result marker is generated inside the wrapper with `crypto.randomUUID()` and announced on the first stdout line, and the step inputs travel through a temp JSON file passed as `Deno.args[0]` with a matching `--allow-read`, instead of being inlined into the source.

## Context

Each flow run gets an isolate box id from a fixed pool (1..N) and the box runs as UID `60000 + id`, so `AP_SANDBOX_REUSE=false` in production still means the same handful of UIDs come back run after run. The first box to run a step filled the cache with files owned by its UID, mode `644`, and directories mode `755`. On the preview instance a warm cache showed no gain: the owner box ran a step in about 85 ms, every other box in about 240 ms, slower than a cold cache at about 150 ms.

The wrapper source used to embed a `nanoid()` marker and `JSON.stringify(inputs)`, so each run was a new module. Deno writes a transpiled emit for each new stdin module into `gen/file/root/codes/<fv>/<step>/`, and a non-owner UID cannot write into a `755` directory it does not own. The failed write is what pushed the run past the cold path. Pre-seeding the SQLite caches as `666` proved they were not the cause: the boxes stayed slow with fully writable databases.

## Why

A constant wrapper removes the write instead of permitting it. After the first fill, no run has anything new to emit, so `644` files and `755` directories serve every UID, and a changed step costs one normal run rather than a cold start. The marker is still unguessable by user code because it is created after `console.log` has been captured, and user code cannot forge the result line.

The rejected option was to open the whole cache tree with a recursive `chmod a+rwX` from the worker. It worked on the preview, but a legacy code step (`useDeno: false`) runs as a plain node child with the engine's own filesystem access and could replace a cache entry with a symlink between the worker's `readdir` and its `chmod`; the root worker would then follow the link and change the mode of an arbitrary host file. A per-box cache subdirectory was also rejected: it multiplies the cold fills by the pool size and the cache is already per flow version.

## Consequences

`deno.run` takes `data` instead of expecting the caller to inline it, and `runCodeModule` in the engine calls `mod.code(data)`. The cache dir is created once per flow version with `mkdir` plus `chmod 0777` on the root only. Verified on the preview with the five-box pool: steps without npm dependencies run in 65 to 92 ms on every box, a step importing lodash, dayjs, uuid and date-fns in 170 to 237 ms, and only the first run after a deploy pays the fill. The cache lives one level above the per-step directory, so a content-hash invalidation of a step does not wipe it; deno keys by content so stale entries are harmless, but the directory only grows until the flow version's code dir is removed.
