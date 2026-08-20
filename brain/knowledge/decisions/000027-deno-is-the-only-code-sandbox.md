---
status: accepted
---

# Deno is the only code sandbox

## Decision

Every execution mode runs Code steps and expression scripts through one `CodeSandbox` implementation: a one-shot Deno process with per-mode permission flags. The `isolated-vm` V8 sandbox, the no-op sandbox, and the script-session layer (`createScriptSession` / `SharedScriptSession`) are removed, along with the `isolated-vm` docker prebuilds and the `--no-node-snapshot` node arg that existed only for it.

## Context

`SANDBOX_CODE_ONLY` wrapped Code steps in `isolated-vm`; other modes ran unsandboxed or leaned on OS-level isolation. That meant two sandbox implementations, a native addon shipped at the image's filesystem root, and a session abstraction whose Deno version was already just per-run `runScript` around a mutable context.

## Why

One permission-flag model covers all modes (differing only in granted flags), and Deno's syscall-time checks give code-only modes capabilities the bare isolate never had (timers, Buffer, console, pure-compute node builtins) while still denying fs/net/env/run. The rejected alternative — keeping isolated-vm for code-only — retained a native dependency, a second semantics (no event loop, structured-copy results), and the session machinery for its isolate-reuse benefit, which Deno cannot honor anyway (each run is a fresh process).

## Consequences

`props-resolver` builds a script context per evaluation and calls `runScript` directly — a process spawn per expression evaluation, and no cross-script state within a resolution. Results JSON round-trip (`Date` → string, `Map`/`Set` → `{}`). The deno binary must be provided via `AP_DENO_PATH`; nothing resolves it from npm at runtime. PRs: #14370 (deno sandbox), #14957 (removal).
