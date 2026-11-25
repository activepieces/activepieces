---
id: workers-no-longer-pre-warm-the-flow-cache-on-startup-by
title: "Workers no longer pre-warm the flow cache on startup by default"
added: '2026-08-25'
release: 0.89.0
---

Since 0.86.2 every worker pre-filled its local piece and code cache on startup by resolving and compiling every enabled flow on the platform. That warm-up costs memory and CPU proportional to the number of enabled flows: on instances with many flows it pinned each worker at its CPU limit for the duration and spiked memory enough to OOM-kill small workers, especially during upgrades when all workers restart at once. The warm-up is now opt-in behind the new `AP_PREWARM_CACHE_ON_STARTUP` worker environment variable, which defaults to `false`. When disabled, caches fill lazily on each flow's first run after a worker starts, exactly as they did before 0.86.2.

#### What you need to do

Nothing, unless you want to keep the warm-up behaviour of 0.86.2 through 0.88.4. Set `AP_PREWARM_CACHE_ON_STARTUP=true` on your worker containers to restore it — recommended only if your instance has a modest number of enabled flows and your workers have memory headroom. See [Environment Variables](/install/reference/environment-variables) for details.
