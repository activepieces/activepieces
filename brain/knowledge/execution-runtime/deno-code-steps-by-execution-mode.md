---
icon: 🦕
---

# Deno Code Steps by Execution Mode

A code step with `useDeno: true` runs as a one-shot `deno run` child of the engine, fed its program over stdin. `AP_EXECUTION_MODE` decides where that engine lives, which permission flags deno gets, and whether the deno cache survives the run. The legacy path (`useDeno` unset) is listed last because its boundary is a different one.

| | `UNSANDBOXED` | `SANDBOX_CODE_ONLY` | `SANDBOX_PROCESS` | `SANDBOX_CODE_AND_PROCESS` |
| --- | --- | --- | --- | --- |
| Engine process | forked on the host, worker's UID | forked on the host, worker's UID | inside an isolate box, UID `60000 + boxId` | inside an isolate box, UID `60000 + boxId` |
| Code dir seen by deno | host path, writable | host path, writable | `/root/codes/<flowVersionId>` read-only mount | `/root/codes/<flowVersionId>` read-only mount |
| Deno permissions | tmp read/write, net, env, sys | none | tmp read/write, net, env, sys | none |
| Propagated env | `AP_SANDBOX_PROPAGATED_ENV_VARS` names | nothing | `AP_SANDBOX_PROPAGATED_ENV_VARS` names | nothing |
| tmp | host `/tmp` | host `/tmp` | `/box` (the per-box scratch mount) | `/box` |
| Warm `DENO_DIR` | always, `<codes>/<fv>/.deno-cache` | always, same path | only with `AP_REUSE_SANDBOX=false`, via a `:rw` mount | same as `SANDBOX_PROCESS` |
| Legacy `useDeno: false` | node child process, host privileges | `isolated-vm` v8 isolate | node child process, box privileges | `isolated-vm` v8 isolate |

**Permission set** — `code-sandbox.ts` maps the mode to a `DenoPermission[]`; `deno.run` turns it into `--allow-*` flags. Every mode also gets `--allow-read` on the step directory and on the inputs file, `--no-remote`, `--no-config`, `--no-lock`, `--node-modules-dir=manual` and a V8 heap cap of 128 MB. `ALL` collapses to `-A` and is never used by the engine.

**Net** — the two `*_CODE_*` modes give a deno step no network at all. The isolate modes pass `--share-net`, so a deno step in `SANDBOX_PROCESS` reaches the network with the box's own identity.

**Warm cache** — `resolveWarmDenoDir` in `deno-code-sandbox.ts` points `DENO_DIR` at `<codes>/<flowVersionId>/.deno-cache` when the step dir is writable (the two forked modes) or when the worker set `AP_DENO_CACHE_MOUNTED=true`. The worker sets it only for a non-reusable isolate sandbox, because a reusable one mounts the whole `/root/codes` tree and a writable cache inside it would let one flow version tamper with another's. Otherwise the run gets a fresh `mkdtemp` under `os.tmpdir()` and deletes it on exit, so every run is cold. How the shared cache stays warm across the box UIDs is the decision *The deno cache is shared across isolate boxes by keeping the wrapper constant*.

**Inputs** — step inputs are written to `${os.tmpdir()}/ap-deno-data-*/data.json` and passed as `Deno.args[0]`, never inlined into the program. In an isolate box that temp dir is `/box`, which the box owns, so the file needs no extra mount.

## What the reusable flag changes

`AP_REUSE_SANDBOX` decides whether one engine process serves many jobs or each job gets a fresh one. Unset, `canReuseSandbox` in `sandbox-manager.ts` says yes in development and in the two forked modes, no in the two isolate modes. The flag changes three things for deno steps.

| | reusable | not reusable |
| --- | --- | --- |
| Engine lifetime | kept across jobs while it stays ready | shut down after every `release` |
| Code mount (isolate modes) | the whole `/root/codes` tree, read-only, spanning every flow version on the host | `/root/codes/<flowVersionId>` only |
| `.deno-cache` mount | none, so `AP_DENO_CACHE_MOUNTED` is unset and every deno run is cold in an isolate | `:rw` mount of `<codes>/<fv>/.deno-cache` plus `AP_DENO_CACHE_MOUNTED=true` |

In the forked modes the flag only affects engine lifetime: the warm cache is reached by host path either way. In the isolate modes a reusable engine cannot get the cache mount because its code mount is not scoped to one flow version, and a writable cache under a tree shared by every flow would let one flow's step poison another's. Running an isolate mode with `AP_REUSE_SANDBOX=true` therefore trades the per-job engine boot for a cold deno run on every step.

Not reusable does not mean a new identity each time. Box ids come from a fixed pool of `AP_WORKER_CONCURRENCY` slots and box `N` always runs as UID `60000 + N`, so the same few UIDs revisit the shared cache. That is why the cache can stay warm with `AP_REUSE_SANDBOX=false`, which is what production runs.

## Gotchas

- `SANDBOX_CODE_ONLY` and `SANDBOX_CODE_AND_PROCESS` run deno steps with no `env` permission, so `AP_SANDBOX_PROPAGATED_ENV_VARS` is silently ignored there; `buildPropagatedEnv` returns an empty object before reading the list.
- The deno cache dir sits one level above the per-step dir, so the content-hash invalidation that wipes `<codes>/<fv>/<step>` leaves it in place. Deno keys entries by content, so stale entries are harmless, but the dir only shrinks when the flow version's code dir goes.
- Deno steps never touch `isolated-vm`; a worker whose `isolated-vm` native build failed still runs deno steps, and only legacy steps in the two `*_CODE_*` modes break.
- `AP_DENO_PATH` must point at the binary; the engine throws instead of searching `PATH`. The image pins deno 2.9.3 at `/usr/local/bin/deno`.

## Key files

- `packages/server/engine/src/lib/core/code` — `initCodeSandbox` picks the sandbox per mode and `useDeno`; `denoCodeSandbox` builds the program and the warm `DENO_DIR`
- `packages/core/utils/src/lib/deno.ts` — `deno.run`, the permission flags, the stdin wrapper and the result marker
- `packages/server/sandbox/src/lib` — `createSandboxForJob` picks isolate vs fork per mode; `sandbox.ts` adds the `.deno-cache` `:rw` mount and `AP_DENO_CACHE_MOUNTED`
