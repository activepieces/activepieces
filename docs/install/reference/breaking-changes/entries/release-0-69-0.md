---
id: release-0-69-0
title: "0.69.0"
added: '2025-12-10'
release: 0.69.0
legacy: true
---

### What has changed?
- `AP_FLOW_WORKER_CONCURRENCY` and `AP_SCHEDULED_WORKER_CONCURRENCY` are now deprecated all jobs have single queue and replaced with `AP_WORKER_CONCURRENCY`

### When is action necessary?

- If you are using `AP_FLOW_WORKER_CONCURRENCY` or `AP_SCHEDULED_WORKER_CONCURRENCY`, you should replace them with `AP_WORKER_CONCURRENCY`
