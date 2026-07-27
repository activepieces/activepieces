---
icon: 🧟
---

# Gotcha: a worker can wedge mid-poll-loop and still report healthy

**Incident 2026-07-26.** `workerJobs` reached **229,682 prioritized / active:1** while all ~450 worker
containers were `Up 2 days (healthy)`. Fleet throughput hit zero around 20:00 UTC. Restarting a
container restored job execution within seconds; a rolling `docker restart` across all 25 hosts
recovered the fleet (`active:408`, backlog draining ~5k/min).

**Where it came from.** `probeServerPing` did not exist before **2026-07-21**; PR #14181
("benchmark rate limiter info", `92b8115b21`) added it to `buildMachineInfo()` purely to populate a
`serverPingMs` field on the workers page. `buildMachineInfo()` is awaited **inside the poll loop,
once per iteration, before `apiClient.poll()`** — so a diagnostic call landed on the hot path. It
first reached prod in image `0.86.3.9c53aeaf` (commit 2026-07-24 10:37, containers created
10:46 UTC); the image it replaced, `0.86.3.01757ac6` (2026-07-20 18:34), does not contain it. Two
days later the fleet started wedging. That is the regression window — if a worker "used to be fine",
this is why.

Recurrence is fast: after the 2026-07-26 21:31 recovery restart, **13 of 14 sampled containers on
one host were wedged again by 07:30 the next morning** (~14h), fleet `active:103` against 484
containers. See [[gotcha-polling-starves-first-when-the-fleet-loses-capacity]] for what a partial
wedge looks like from the customer side.

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

**On a build that predates the fix below** (anything up to and including `0.86.3.9c53aeaf`):
`~/restart-workers.sh` on the DevOps box (`root@49.13.51.126`). It holds the 25-host list, forks one
ssh per host, and inside each host restarts `activepieces-shared05_*` sequentially with
`docker restart -t 30` and a 2s stagger — roughly **20 minutes fleet-wide** (28 containers × ~45s).
A fresh process is the only thing that re-arms the loop; nothing self-heals.

Two signals to read while it rolls, both of which confirm the diagnosis rather than just the restart:

- Every container burns the **full 30s SIGTERM timeout** before dying. A wedged node process does not
  answer SIGTERM; if containers stop in 2–3s instead, they were idle, not wedged, and you are chasing
  the wrong thing.
- Restarted containers report `(healthy)` within **22 seconds**, before they have polled anything.
  That is the lying health server — watch `workerJobs:active` climbing instead.

Redis is DigitalOcean-managed and its cert does not verify from the DevOps box; the working invocation
is `docker exec redis redis-cli --tls --insecure -h <AP_REDIS_HOST> -p 25061 --user default -a <pw>`,
with creds read off any `activepieces-app_*` container's env. Workers carry no Redis env at all — they
reach the queue only through the app over Socket.IO.

Keep 2–3 frozen containers unrestarted for forensics — they are the only evidence, and a fleet-wide
restart destroys it. `restart-workers.sh` already skips `shared05_1/_3/_7` on `188.245.191.196` and
`shared05_2` on `91.98.16.70`; at ~0.8% of capacity that is cheap enough to leave in place every run.

**A restart buys ~14 hours, not a fix.** After the 2026-07-26 21:31 recovery, 13 of 14 sampled
containers were wedged again by 07:30 the next morning with the backlog at 128k. Until the
`probeServerPing` fix ships, budget on re-running this daily.

**On a build that carries the fix:** a wedged loop restarts itself. The watchdog exits the process
after `POLL_LIVENESS_TIMEOUT_MS` (180s) of no iteration and pm2 brings it back, so the manual rolling
restart is a fallback, not the routine. If you still find wedged containers, the watchdog itself is
not firing — treat that as a new bug and preserve a container before restarting.

## What the fix changed

Landed in `fix(worker): stop a hung server-ping from silently wedging the poll loop`:

- `probeServerPing` races its fetch against its own timeout and cancels the response body, so it
  always resolves. Wrapping `buildMachineInfo()` in a timeout alone was not enough — a permanently
  hung probe still starved the loop through its 20s error-retry path.
- A poll watchdog exits the process when the socket is connected and a loop has not iterated for 180s;
  the health endpoint returns **503** on the same condition instead of an unconditional 200. Liveness
  is tracked **per poll loop**, so with `AP_WORKER_CONCURRENCY > 1` a healthy sibling cannot mask a
  wedged loop; a loop executing a job is excluded rather than the whole worker.
- The poll loop logs at warn when it exits, which it previously did in complete silence.

## Still worth landing

- Raise the `memory: 1g` limit for `AP_WORKER_CONCURRENCY: 1` shared workers, or lower
  `--max-old-space-size=768`; the OOM loop is what supplied the wedge its 848 attempts. This is a
  `mrsk/prod/config/worker.yml` change, not a repo change.
- Add `packages/server/worker` to CI's test filter — `worker.test.ts` does not run in CI today.

Related: [[gotcha-kamal-app-exec-leaks-a-permanent-worker]] — the other way a worker container looks
alive and healthy while consuming nothing.
