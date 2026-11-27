---
id: release-0-71-0
title: "0.71.0"
added: '2025-12-10'
release: 0.71.0
legacy: true
---

### What has changed?

- In separate workers setup, now they have access to Redis.
- `AP_EXECUTION_MODE` mode `SANDBOXED` is now deprecated and replaced with `SANDBOX_PROCESS`
- Code Copilot has been deprecated. It will be reintroduced in a different, more powerful form in the future.

### When is action necessary?

- If you have separate workers setup, you should make sure that workers have access to Redis.
- If you are using `AP_EXECUTION_MODE` mode `SANDBOXED`, you should replace it with `SANDBOX_PROCESS`
