---
name: profile-app-cpu
description: "Find what is burning CPU in a live app container without restarting it: separate the JS thread from GC and libuv, open the V8 inspector in place with SIGUSR1, take a CPU profile over CDP, and aggregate it back to the function that owns the time. Use when containers sit at their CPU cap, healthchecks time out with nothing crashed, or a self-hoster reports the app 'unhealthy' but the process is alive."
---

# Profile a CPU-Bound App Container

The sibling of `profile-worker-memory`. That one answers *what is holding memory*; this one answers *what is burning CPU*, and it does it on a running production container without a restart — a restart destroys the very state you are trying to measure.

**A profile stays on the box until you have looked at it.** A `.cpuprofile` embeds function names, file paths and script snippets. Move the aggregated hot-frame list, not the raw file, off a customer's host.

## 1. Rule out the database before you profile

An app waiting on Postgres is *idle*, not busy. If containers are actually pegged, the DB is almost never the cause — but check first. Take the shape of the connection pool, including how many sessions are blocked on the *client*:

```sql
select count(*) total,
       count(*) filter (where state='active') active,
       count(*) filter (where state='idle in transaction') idle_in_txn,
       count(*) filter (where wait_event_type='Lock') waiting_on_lock,
       count(*) filter (where wait_event='ClientRead') waiting_on_client
from pg_stat_activity;
```

Then look at the individual sessions, because the wait event per session is what actually decides this:

```sql
select now() - query_start as dur, state, wait_event_type, wait_event, left(query, 120) as q
from pg_stat_activity
where state <> 'idle' and query_start is not null
order by 1 desc
limit 15;
```

The tell that the **app** is the bottleneck: sessions sitting in `wait_event=ClientRead` for seconds at a time, with `waiting_on_lock` at zero. `ClientRead` means Postgres has done its work and is waiting for the client to read the results — the event loop is blocked, and the DB is a victim rather than a cause. A genuinely struggling database looks the opposite: non-zero lock waits, or long `dur` on sessions whose `wait_event_type` is `IO` or `LWLock`.

## 2. Find which thread is hot

`docker stats` gives a percentage where 100% = one core, so a container capped at `cpus: 1` reads ~100% when saturated. Break it down per thread:

```bash
PID=$(docker inspect -f '{{.State.Pid}}' <container>)
top -H -b -n 1 -p $PID
```

Read the `TIME+` column, not just `%CPU`:

- **`MainThread` hot** → JS on the event loop. Continue to step 3.
- **`V8Worker` threads hot** → GC. Look at heap pressure, not application code.
- **`libuv-worker` hot** → fs/crypto/zlib in the threadpool.

Compare `TIME+` against container age. 105 CPU-minutes over 27 hours is ~6% average — that is **bursty**, not a steady spin, and it means you must sample while it is actually hot.

## 3. Open the inspector in place

Node starts the inspector on `SIGUSR1` without restarting. It binds to `127.0.0.1:9229` **inside the container's network namespace**, so it is not reachable from outside the host.

```bash
docker exec <container> sh -c 'kill -USR1 1'
docker exec <container> node -e 'require("http").get({host:"127.0.0.1",port:9229,path:"/json/version"},r=>r.pipe(process.stdout))'
```

Two caveats worth knowing before you do this on production:

- The inspector cannot be closed again; it lives until the process exits. Prefer a container you can recycle afterwards, and say so in the incident notes.
- The `Profiler` domain only *samples*. It does not pause the process the way a breakpoint would.

## 4. Take the profile

Node 22+ ships a global `WebSocket`, so the CDP client needs no dependency. Run it *inside* the container so it shares the network namespace:

```js
const http = require('http'), fs = require('fs')
const getWs = () => new Promise((res, rej) =>
  http.get({ host: '127.0.0.1', port: 9229, path: '/json/list' }, r => {
    let d = ''; r.on('data', c => d += c)
    r.on('end', () => { try { res(JSON.parse(d)[0].webSocketDebuggerUrl) } catch (e) { rej(new Error(d)) } })
  }).on('error', rej))

;(async () => {
  const ws = new WebSocket(await getWs())
  let id = 0; const pending = new Map()
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  await send('Profiler.enable')
  await send('Profiler.setSamplingInterval', { interval: 400 })
  await send('Profiler.start')
  await new Promise(r => setTimeout(r, 30000))
  const { profile } = await send('Profiler.stop')
  fs.writeFileSync('/tmp/cpu.cpuprofile', JSON.stringify(profile))
  console.log('samples=' + profile.samples.length)
  process.exit(0)
})()
```

`docker cp` it in, run it with `node`, `docker cp` the result out. 30s at a 400µs interval is ~50k samples — plenty, and light enough not to distort the result.

## 5. Aggregate by function, not by stack node

This is the step people skip, and it is why profiles get misread. V8 emits a **separate node per call stack**, so one hot function shows up dozens of times, each with a small percentage, and none of them look significant. Sum self-time by `(functionName, url, line)` first:

```js
const p = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'))
const byId = new Map(p.nodes.map(n => [n.id, n]))
const self = new Map()
for (const s of p.samples) self.set(s, (self.get(s) || 0) + 1)
const agg = new Map()
for (const [id, c] of self) {
  const f = byId.get(id).callFrame
  const k = `${f.functionName || '(anon)'} @ ${f.url}:${f.lineNumber + 1}`
  agg.set(k, (agg.get(k) || 0) + c)
}
const total = p.samples.length
;[...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([k, c]) => console.log((100 * c / total).toFixed(2).padStart(6) + '%  ' + k))
```

Read the result against `(idle)`: at 49% idle, a frame at 42% of wall-clock owns ~84% of the CPU actually being spent. Report both numbers — "42% of wall-clock, 84% of non-idle" is the sentence that makes the finding land.

To spot **runaway recursion**, walk each sampled stack and count repeats of one function. A long chain of the same frame with a slowly decaying percentage (22% → 19% over 30 frames) is recursion whose per-level cost is proportional to what remains below it — the signature of an accidental O(N²).

## Gotchas

- **Healthcheck timeouts are a symptom of a blocked event loop, not a crash.** A container shows `unhealthy` with `FailingStreak` climbing while the app still serves traffic; the `curl` healthcheck simply cannot be answered within its timeout. Zombie `curl` processes accumulating inside the container (`ps -eo stat | grep ^Z`) are those killed healthchecks, not a leak. Which container looks unhealthy rotates with traffic, so do not over-index on the one the alert names.
- **`docker stats` CPU is per-core, not per-host.** 100% means one full core. Against `cpus: 1` that is the cap, even though the host shows plenty of idle.
- Bursty load means an instantaneous `docker stats` disagrees with `TIME+` and with load average. Pick your profiling target from a fresh `docker stats` reading taken seconds before you attach.
