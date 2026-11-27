---
id: code-steps-run-on-deno-by-default
title: "Code steps run on Deno by default"
added: '2026-10-18'
release: 0.93.0
---

Code steps without an explicit `useDeno` flag now run on Deno instead of the legacy Node sandbox. This applies to every existing flow. Code is transpiled to CommonJS, so `require`, `module.exports`, `__dirname` and `package.json` dependencies still work.

What changes depends on `AP_EXECUTION_MODE`:

- `UNSANDBOXED` (the default) or `SANDBOX_PROCESS`: steps see no environment variables except `PATH`, can read and write files only under `os.tmpdir()`, and cannot spawn processes.
- `SANDBOX_CODE_ONLY` or `SANDBOX_CODE_AND_PROCESS`: nothing new is blocked. A step over the 128 MB heap cap now fails with a process signal error instead of an isolate memory error.
- In every mode, a step with top-level `await` runs as a strict ES module. Assigning to an undeclared variable throws, and `exports`, `module`, `__dirname` and `__filename` are undefined. Low-level Node APIs (`process.binding`, `node:vm`, `node:cluster`) and native addons that predate Node-API may not work.

#### What you need to do

- To pass environment variables to code steps, list their names in `AP_SANDBOX_PROPAGATED_ENV_VARS` on the API container and set the values on the worker container.
- Write scratch files under `os.tmpdir()`.
- In steps with top-level `await`, move the awaited call inside `code` or declare the variables.
- If you don't use the official Docker images, install Deno and set `AP_DENO_PATH`. Without it, every code step fails.
- Update alerts that match the old isolate memory error.

To find affected steps, search the logs for the `Code step failed` warning, which names the flow run, step, runtime (`codeRuntime: deno|legacy`) and error. To move a flow back to the legacy runtime while you fix it, set `AP_API_KEY` and call `POST /v1/admin/flows/revert-from-deno` with the `api-key` header and a body of exactly one of `flowIds`, `projectId` or `platformId`.
