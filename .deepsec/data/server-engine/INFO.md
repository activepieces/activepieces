# server-engine

## What this codebase does

The Activepieces flow execution engine. Runs user-authored JavaScript code
inside `isolated-vm` (v8 isolates) or a child-process fallback, marshals
piece (integration) inputs, resolves `{{variables}}` from prior steps, and
makes outbound HTTP on the user's behalf. Loaded by the worker as a library
and by the API for code-only "test step" runs.

## Auth shape

The engine has no end-user auth surface of its own — it runs as a trusted
component invoked by the worker. The only "credential" surface is the
piece-auth payload (`context.auth`) resolved by `props-resolver.ts`, which
holds third-party OAuth tokens and API keys for the duration of a run.

## Threat model

The crown jewel is the **sandbox boundary**. User-authored code is, by
design, executed here — but a sandbox escape, a file-system read outside
the run dir, or an outbound connection to private/metadata IPs would let a
malicious flow author exfiltrate other tenants' secrets or pivot into the
host network. The second concern is **token leakage**: `context.auth`
shouldn't end up in error messages, logs, or request URLs (as opposed to
headers).

## Project-specific patterns to flag

- **Outbound HTTP that bypasses the SSRF guard.** All outbound requests
  initiated by step execution MUST go through the project's
  `request-filtering-agent`-backed HTTP client (see `src/lib/network/`).
  Raw `fetch`, `http.request`, `axios.create`, or a custom `http.Agent`
  on user-controlled URLs is a real SSRF.
- **`spawn`/`exec`/`execFile` with non-constant argv.** Subprocess spawning
  is used for the no-op sandbox; argv must be hardcoded and code/data must
  flow over stdin or a message channel — never interpolated into argv or
  shell strings.
- **`require()`/`import()` of dynamic, user-controlled paths.** Module
  resolution against user input would let a flow load arbitrary host files.
- **Logging `context.auth` or `step.input` verbatim.** Piece auth payloads
  and resolved step inputs contain third-party tokens. Any logger call
  that takes one of these objects directly (without redaction) is a leak.
- **Path traversal in run-dir IO.** File handling inside a run dir must
  resolve and assert containment (`startsWith(runDir)`) before read/write.

## Known false-positives

- The v8-isolate sandbox (`src/lib/core/code/v8-isolate-code-sandbox.ts`)
  legitimately creates `new ivm.Isolate()` and evaluates user code —
  that's the entire point. Don't flag the `evalClosureSync` /
  `runScript` calls inside the isolate wrapper.
- The child-process fallback (`src/lib/core/code/no-op-code-sandbox.ts`)
  legitimately `spawn`s `process.execPath` with a fixed argv
  (`['--eval', CODE_RUNNER_SCRIPT]`) and passes the code over IPC — not
  argv. The `Function(...params, body)` constructor inside the runner is
  intentional and isolated; don't flag it.
- Outbound calls to trusted Activepieces endpoints via `apAxios` (e.g.
  fetching piece metadata at boot) — `apAxios` is itself built on
  `safeHttp`.

## Editions

`AP_EDITION` (`ce`/`ee`/`cloud`) is observed at boot, but the engine itself
is edition-agnostic — there is no `src/lib/ee/` subtree here. Any
`import … from "…/ee/…"` would be a layering bug.
