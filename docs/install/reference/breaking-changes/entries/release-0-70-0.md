---
id: release-0-70-0
title: "0.70.0"
added: '2025-12-10'
release: 0.70.0
legacy: true
---

### What has changed?
- `AP_QUEUE_MODE` is now deprecated and replaced with `AP_REDIS_TYPE`
- If you are using Sentinel Redis, you should add `AP_REDIS_TYPE` to `SENTINEL`

### When is action necessary?

- If you are using `AP_QUEUE_MODE`, you should replace it with `AP_REDIS_TYPE`
- If you are using Sentinel Redis, you should add `AP_REDIS_TYPE` to `SENTINEL`
