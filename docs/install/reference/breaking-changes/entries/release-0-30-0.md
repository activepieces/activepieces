---
id: release-0-30-0
title: "0.30.0"
added: '2025-12-10'
release: 0.30.0
legacy: true
---

### What has changed?

- `AP_SANDBOX_RUN_TIME_SECONDS` is now deprecated and replaced with `AP_FLOW_TIMEOUT_SECONDS`
- `AP_CODE_SANDBOX_TYPE` is now deprecated and replaced with new mode in `AP_EXECUTION_MODE`

### When is action necessary?

- If you are using `AP_CODE_SANDBOX_TYPE` to `V8_ISOLATE`, you should switch to `AP_EXECUTION_MODE` to `SANDBOX_CODE_ONLY`
- If you are using `AP_SANDBOX_RUN_TIME_SECONDS` to set the sandbox run time limit, you should switch to `AP_FLOW_TIMEOUT_SECONDS`
