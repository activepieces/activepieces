---
id: release-0-84-0
title: "0.84.0"
added: '2026-05-12'
release: 0.84.0
legacy: true
---

### What has changed?

#### Flow Run Log Size Enforcement
This is an important behavior change in how flow run logs are stored and capped, but **no action is required** — the existing default (`AP_MAX_FLOW_RUN_LOG_SIZE_MB=50`) is preserved.

- Large step outputs are now offloaded to object storage instead of sitting inline in worker memory, controlled by the new `AP_FLOW_RUN_LOG_SLICE_THRESHOLD_KB` env var (default `32`).
- Large step input values are replaced with a `(truncated, original size <N>)` placeholder in the log via the new `AP_FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB` env var (default `2`). The step still receives the full value at runtime.
- Runs whose combined step inputs and outputs exceed `AP_MAX_FLOW_RUN_LOG_SIZE_MB` now terminate with the new `LOG_SIZE_EXCEEDED` status instead of silently trimming inputs. Offloaded outputs still count their original size against the cap.
- See [Limits → Files & flow run logs](/install/reference/limits#files-flow-run-logs) for the full behavior, environment variables, and defaults.
- Embedding now requires setting allowed embed origins, which means only the domains listed in the field can embed the app (wildcards are supported). There is also a new env variable `AP_ALLOWED_EMBED_ORIGINS` for setting pre-allowed origins, and a new endpoint for adding these origins — [check docs](/endpoints/embedding/add-allowed-embed-origins).
- "Sign in with Google" can no longer be enabled from the SSO page in the admin panel — that setting has been removed. It is now controlled solely by the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables. The button only appears when both are set (and the platform's Google auth toggle is enabled).

### Do you need to take action?
- **Embedding** — if you are embedding your self-hosted activepieces somewhere make sure it's on the allow list
- Only if you set up Google SSO from the admin panel. Move your Google OAuth2 credentials into the `AP_GOOGLE_CLIENT_ID` and `AP_GOOGLE_CLIENT_SECRET` environment variables.
