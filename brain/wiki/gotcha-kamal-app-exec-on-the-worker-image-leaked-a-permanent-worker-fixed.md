---
icon: ⚙️
---

# Gotcha: kamal app exec on the worker image leaked a permanent worker (fixed)

`docker-entrypoint.sh` used to **never honor `"$@"`**. Whatever command it was handed, it built `/tmp/ecosystem.config.js` from `AP_CONTAINER_TYPE` and ended on `pm2-runtime start`. Because `Dockerfile` uses exec-form `ENTRYPOINT ["./docker-entrypoint.sh"]`, a command passed at run time arrives as *arguments*, not a replacement — so `kamal app exec <cmd>` against `activepieces-cloud` did not run `<cmd>`. It inherited the role's env (`AP_CONTAINER_TYPE=WORKER`), booted a **full, permanent worker**, and never returned output. One container per host, per invocation.

**Fixed** — the entrypoint now starts with:

```sh
if [ "$#" -gt 0 ]; then
    exec "$@"
fi
```

Deliberately placed *before* all setup so an exec'd command skips the JWT generation and PM2 config write entirely. Safe because normal boot passes no arguments (`$#` is 0 and it falls through) — there is no top-level `CMD` in the Dockerfile; the only `CMD` belongs to `HEALTHCHECK` and never becomes `$@`. The comment lives here rather than in the script, by choice.

### What it cost (July 2026)
A single `kamal app exec "ls /root/codes"` on 2026-07-09 left **412 orphan containers** — `activepieces-shared05_<N>-exec-latest-<hash>`, one per worker slot across the 25 hosts in `mrsk/prod/config/worker.yml` — still running 18 days later with `RestartCount: 0`, holding **~86 GB RAM** fleet-wide and 4–15% CPU. Tell-tale in `docker ps`: `Cmd` is the command you asked for, but the container is `Up 2 weeks (healthy)` and logging worker output.

### They were NOT harmless — correcting the original read
The first conclusion was "dead weight, not dangerous," on the basis that the orphans sat in the version-mismatch guard (`Connected app version mismatch — pausing polling…`) and a 101-container sample showed 0 with job activity. **That is only true after the fleet moved past 0.86.1.** Verified from ClickHouse:

- Worker hosts at 12:00 UTC went **491 (2026-07-08) → 962 (2026-07-10)** — ~470 new hosts appeared on 2026-07-09.
- They came up on **0.86.1, exactly the release the fleet was running that day** (API 2.98M log lines on 0.86.1; 0.86.2 barely starting at 13k).

So the version gate did not block them. For roughly **11 days they were fully eligible workers executing real production jobs** as untracked containers that no `kamal deploy` would drain or upgrade. The gate is what eventually *stopped* them once the fleet reached 0.86.2/0.86.3 — not what prevented them. Any deploy in that window had ~470 workers it could not gracefully stop, which feeds the orphaned-jobs-in-`active` problem (see [[Gotcha: job dispatch is one serial loop per queue with a DB round-trip per job]]).

**This was at least the second occurrence.** A lone `0.85.2` worker was already present on 2026-07-08 logging at a constant 1,860/hr — an earlier leak from whenever 0.85.2 was deployed.

### The staleness is emergent — there is no bad tag
Do not go looking for a stale `:latest`. **`activepieces-cloud` has no `latest` tag at all** — 4,000 versions scanned back to 2026-05-07, none carrying it. Every cloud workflow pushes only immutable `<release>.<sha>.beta` / `.canary` / `release-candidate`; `:latest` goes only to the OSS repo `activepieces/activepieces`. The `exec-latest` in the container name is Kamal's naming for an exec container, not a registry reference.

A leaked container is simply **pinned forever to whichever release was deployed the day it leaked**, because nothing restarts, drains, or redeploys it. Version drift then accumulates on its own.

### Why it hid for 18 days
Two reasons, both structural:
- `HEALTHCHECK` in the Dockerfile exits 0 unconditionally for `AP_CONTAINER_TYPE=WORKER` (workers have no HTTP server), so orphans always report `(healthy)`.
- The mismatch warning fired ~1.9M times per 12h and **nothing alerts on it**. The signal screamed continuously and no one was listening. There is still no alert on "a worker container is running a release other than the deployed one" — that is the gap worth closing.

### Cleanup
Scoped by name; live containers are `activepieces-shared05_<N>-<version>.beta`, so `exec-latest` matches only orphans:

```bash
docker rm -f $(docker ps -aq --filter name=exec-latest)
```

Leave the `Exited (137)` containers from prior deploy generations alone — those are the `kamal rollback` targets, inside Kamal's `retain_containers` budget.

Inspect live via the DevOps box (`49.13.51.126`), which holds SSH to every worker host; fan out `docker ps -a` per host into separate files — interleaved parallel SSH on one stream corrupts lines.

### What `app exec` is actually for
Now that it works, the legitimate uses are the fresh-container ones: rollback and migration commands (`docs/install/configure-operate/rollback.mdx` currently uses `--entrypoint npm` purely to work around this bug — that hack can go), inspecting what actually shipped in an image, and checking how config resolves under a role's real env. Use `kamal app exec --reuse` instead when you need the *running* container's live state.
