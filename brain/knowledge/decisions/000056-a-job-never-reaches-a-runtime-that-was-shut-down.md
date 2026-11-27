---
status: accepted
---

# A job never reaches a runtime that was shut down

## Decision
A worker gets a fresh sandbox runtime per app connection, and the old one is dead for good. Three guards
keep a job off it, in the order a job would meet them:

1. `pollAndExecute` re-checks its connection right before the poll, with no await in between, so a poll
   loop whose connection was replaced never asks for a job.
2. `createSandboxRuntime` remembers that it was shut down and rejects `execute`, on entry and again
   after provisioning.
3. `createSandbox`'s `start()` notices a shutdown that happened since it began: it creates no process,
   or kills the one it just created.

## Context
On 2026-11-20 four dedicated-worker containers failed every code step with
`ENOENT: no such file or directory, mkdtemp '/box/ap-deno-…'` until they were restarted (ENG-1550).
Each box id maps to one directory, `/var/local/lib/isolate/<boxId>`, and every sandbox boot starts with
`isolate --cleanup`. After a socket drop, the old poll loop was still awaiting `buildMachineInfo`; its
poll went out on the reconnected socket, because Socket.IO buffers an emit made while disconnected. The
app handed it a job, the loop ran it on its own shut-down runtime, and that runtime booted a second
sandbox on box 1. Its `--cleanup` deleted `/box` under the live sandbox of the new runtime. Only workers
with `AP_REUSE_SANDBOX=true` on an isolate mode keep a sandbox alive long enough to be hit.

## Why
The first version of the fix was guard 2 alone. It stopped the damage, but the job still arrived and was
failed, which sends a flow job to the queue's retry backoff for a fault that is ours. Guard 1 is the one
that matches the intent: the job should not get there. Guard 2 stays because a job that was received
legitimately can be between poll and `runtime.execute` when the socket drops; the app has already
returned that job to the queue, so the local copy must not run. Guard 3 covers a start that is already
past both.

Rejected: handing the stale loop's job to the new poll loop. Two operations on one box is the failure the
per-connection runtime exists to prevent. Also rejected: a new RPC to return the job to the queue. It is
a contract change across app and worker versions for a case guard 1 removes.

## Consequences
- A runtime is single-use: after `shutdown()` it never runs again, so anything that wants to keep
  executing must build a new one. A `Sandbox` object can still be started again after a shutdown.
- A job caught by guard 2 or 3 is reported as an internal error. Flow jobs are retried; a synchronous
  caller gets the error back.
- One gap is accepted: a shutdown that lands while `isolate --cleanup` or `--init` is already running
  lets those finish before the new process is killed.
- Signature of this failure if it returns: two `isolate` processes with the same `--box-id` in one
  worker container, one with `cwd=/var/local/lib/isolate/<boxId> (deleted)`.
