---
id: running-out-of-credits-now-stops-production-flow-runs
title: "Running out of credits now stops production flow runs"
added: '2026-08-04'
order: 3
release: 0.87.0
---

When a platform has no credits left, new production runs are recorded with the `QUOTA_EXCEEDED` status instead of executing, and synchronous webhooks respond with HTTP 402. Such a run keeps its trigger payload, so it can be retried once credits are available. Test runs are unaffected.
