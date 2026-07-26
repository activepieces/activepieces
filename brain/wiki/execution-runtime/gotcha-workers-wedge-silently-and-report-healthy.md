---
icon: 🧟
---

# Gotcha: a worker can wedge mid-poll-loop and still report healthy

**Incident 2026-07-26.** `workerJobs` reached **229,682 prioritized / active:1** while all ~450 worker
containers were `Up 2 days (healthy)`. Fleet throughput hit zero around 20:00 UTC. Restarting a
container restored job execution within seconds; a rolling `docker restart` across all 25 hosts
recovered the fleet (`active:408`, backlog draining ~5k/min).

**The workers were not crashing and not disconnected.** The Socket.IO connection stayed live the
whole time — the wedged containers kept receiving `Flow published, prewarming flow cache` pushes and
kept emitting `system.snapshot` heartbeats. They simply stopped calling `poll`. App-side proof: only
**4–5 distinct worker ids** appeared in `[workerRpc#poll] Poll request received` during the incident,
out of ~450. The app withheld nothing — zero `[workerRpc#poll] Withholding job` lines, worker and app
both on `0.86.3`, identical image digest.

## The three things that stack up

1. **PM2 restarts are invisible to Docker.** A wedged sample (`shared05_1`) had `oom_kill 847` in its
   cgroup and PM2 `↺ 848`, against `RestartCount: 0` and health `healthy` for 38.7 hours. The 0.5cpu /
   **1g** shared workers OOM-SIGKILL the node process roughly every 4 minutes; pm2-runtime replaces it
   and Docker never sees a thing. Each restart is a fresh chance to wedge.
2. **The poll loop can park before its first poll.** Log counts on the wedged sample were
   `Connected to API server via Socket.IO` : `Starting poll loops` : `Polling worker started` = **44:44:44**
   — the loop always started. But then: zero `job.execute`, zero `Poll failed`, zero
   `Connected app version mismatch`, zero errors, for 38 hours. `process.getActiveResourcesInfo()` on
   the live wedged process showed only 3 stdio pipes, the one websocket, the health server and 2
   timers — **no HTTP client handle**. `buildMachineInfo()` (`worker.ts:227` → `probeServerPing`) never
   returned, so `apiClient.poll()` was never reached. `probeServerPing` never consumes or cancels the
   `fetch` response body, so its 5s `AbortController` does not reliably release a request queued
   behind a busy undici client.
3. **The health server lies.** It returns `200 {"status":"ok"}` unconditionally — it never checks
   `polling` or last-successful-poll time. So Docker, Kamal and any uptime probe call a worker that has
   consumed nothing in 38 hours "healthy."

## How to tell this apart from the alternatives, fast

The whole diagnosis is one ratio and one grep:

- Worker logs: count `Connected to API server via Socket.IO` vs `Starting poll loops` vs
  `Polling worker started`. **1:1:1 with no `job.execute` after** = wedged inside the loop (this bug).
  Connect **without** a following `Starting poll loops` = the `if (polling) return` latch in
  `startPollingWorkers` (`worker.ts:158`) or a hung `fetchAndStoreSettings`.
- App logs: `grep '\[workerRpc#poll\] Withholding job'`. Any hits = version gate, not this. Also count
  distinct `worker-*` ids polling and compare to fleet size — that single number separates
  "workers stopped asking" from "app stopped answering".
- Queue shape `prioritized` huge + `active` ≈ 1 is **not** an app-side dispatcher wedge. The dispatcher
  is pull-only (`queue-dispatcher.ts:42` `while (waiters.length > 0)`), so zero pollers means zero
  dequeues by design. Confirm before chasing `loopRunning`: when a poll does arrive, dequeue takes
  ~22ms (`Poll request received` 21:14:19.585 → `Dequeued job` 21:14:19.607).

## Recovery

`docker restart` the `activepieces-shared05_*` containers, staggered per host. A fresh process is the
only thing that re-arms the loop; nothing self-heals. Keep 2–3 frozen containers unrestarted for
forensics — they are the only evidence, and a fleet-wide restart destroys it.

## Fixes worth landing

- Wrap `buildMachineInfo()` in a timeout, and make `probeServerPing` consume or cancel its response
  body. Smallest fix that prevents the wedge.
- Make the health server assert `polling === true` **and** a recent successful poll, so the 848
  invisible restarts and the wedge both become visible and self-healing.
- Log at warn when a poll loop exits — today it terminates completely silently.
- Raise the `memory: 1g` limit for `AP_WORKER_CONCURRENCY: 1` shared workers, or lower
  `--max-old-space-size=768`; the OOM loop is what supplies the wedge its 848 attempts.

Related: [[gotcha-kamal-app-exec-leaks-a-permanent-worker]] — the other way a worker container looks
alive and healthy while consuming nothing.
