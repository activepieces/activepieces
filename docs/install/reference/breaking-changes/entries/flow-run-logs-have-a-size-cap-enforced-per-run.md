---
id: flow-run-logs-have-a-size-cap-enforced-per-run
title: "Flow run logs have a size cap enforced per run"
added: '2026-05-12'
order: 1
release: 0.84.0
---

This is an important behavior change in how flow run logs are stored and capped, but **no action is required** — the existing default (`AP_MAX_FLOW_RUN_LOG_SIZE_MB=50`) is preserved.

- Large step outputs are now offloaded to object storage instead of sitting inline in worker memory, controlled by the new `AP_FLOW_RUN_LOG_SLICE_THRESHOLD_KB` env var (default `32`).
- Large step input values are replaced with a `(truncated, original size <N>)` placeholder in the log via the new `AP_FLOW_RUN_LOG_INPUT_TRUNCATE_THRESHOLD_KB` env var (default `2`). The step still receives the full value at runtime.
- Runs whose combined step inputs and outputs exceed `AP_MAX_FLOW_RUN_LOG_SIZE_MB` now terminate with the new `LOG_SIZE_EXCEEDED` status instead of silently trimming inputs. Offloaded outputs still count their original size against the cap.
- See [Limits → Files & flow run logs](/install/reference/limits#files-flow-run-logs) for the full behavior, environment variables, and defaults.
