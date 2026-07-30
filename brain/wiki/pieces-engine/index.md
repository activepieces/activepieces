---
icon: 🧩
---

# Pieces & Engine

How the piece catalog, visibility, formulas, workers, and AI agents fit together.

### Pieces

Metadata catalog of integrations (`@activepieces/piece-*`), served from an in-memory `pieceCache` rebuilt from the `piece_metadata` table and refreshed via pub/sub.

- **Entities/services**: `piece_metadata` (unique on name+version+platformId; `null` platformId = official, set = custom); `pieceMetadataService` (list/get/create/delete + cache), `pieceInstallService` (upload/NPM install → `EXECUTE_METADATA` engine job), `pieceSyncService` (bundled registry → DB).
- **Gotchas**: routes under `/v1/pieces`; install/delete are `platformAdminOnly`; `options` runs dynamic prop eval on a worker. Per-piece/action visibility (EE/Cloud) resolved at read time by `resolveVisibility` → returns `null` on CE. Optional per-action `outputSchema` drives the builder's Smart Output Viewer (opt-in, non-breaking).

### Piece Sets (EE/Cloud only, `managePiecesEnabled`)

Named, reusable piece/action/trigger visibility config a platform admin assigns to many projects. Visibility is **derived at read time** — nothing written when a new piece installs.

- **Entities/services**: `piece_set` (jsonb `config` = include/exclude selection); `pieceSetService` (CRUD, per-platform Default set, project assignment via `project.pieceSetId`). Pure resolvers `isPieceVisible`/`isComponentVisible` shared by server + web.
- **Gotchas**: every platform has one un-deletable Default set; unassigned projects resolve to it. `include_all` auto-shows future pieces, `exclude_all` hides them. Replaces legacy per-project allow/block lists. Embed v4 JWT carries a `pieceSet` key claim (v2/v3 used `piecesTags`). No install-time sync method. Inert/zero-setup on CE.

### Formulas

User-facing data transforms (81+ functions) inside any builder text input via a `/` slash editor; saved inline as `ap-formula-v1::{<expr>}::ap-formula-v1` so they round-trip through flow JSON.

- **Where**: shared lib `packages/core/shared/src/lib/formula/` (`AP_FUNCTIONS` registry is the single source of truth; `formulaEvaluator.evaluate`, type checker). Editor is the TipTap `text-input-with-mentions`. Runtime hooks in the engine's `props-resolver.ts` pre-pass.
- **Gotchas**: no HTTP endpoints, no DB tables, no worker job — evaluation is synchronous in the engine. Runs on **every** edition, unconditionally (even if the editor flag is off, saved formulas still evaluate). Uses `expr-eval`; preprocess normalizes `;`→`,`, `and/or/not`, and rewrites `if()` to lazy ternary. Changing a function = bump `@activepieces/shared` minor; never hard-remove a function (mark `deprecated`).

### Nothing typechecks the engine

`@activepieces/engine`'s `build` is esbuild (`esbuild.config.mjs`, types stripped, never checked) and its `lint` is eslint only — no `tsc --noEmit` in `turbo.json` or any CI workflow. So type errors ship silently: as of Jul 2026 `npx tsc -p tsconfig.lib.json --noEmit` reports errors in `api/engine-file-api.ts`, `api/engine-run-api.ts`, `network/dns-lookup-guard.ts`, `piece-context/flows.ts`, `variables/props-processor.ts` on a clean `main`.

- Run tsc yourself before/after an engine change and **diff the file list** rather than expecting zero — a green run is not the baseline.
- Engine tests only run correctly from the package dir (`cd packages/server/engine && npx vitest run`); from the repo root the root config applies and every file fails collection with `describe is not defined`.

### The engine gets only 64 file descriptors

Under `AP_EXECUTION_MODE=SANDBOX_PROCESS` / `SANDBOX_CODE_AND_PROCESS` the engine runs inside the `isolate` binary (`create-sandbox-for-job.ts` → `isolateProcess`). **The bundled isolate is 1.8.1, which hardcodes** `RLIMIT_NOFILE` **to 64 — soft *and* hard — with no flag to change it.** Verified: `ulimit -n` inside is `64`, outside `1048576`; upstream added `--open-files` only after 1.8.1, so our binary rejects it.

That 64 is the real budget for everything the engine does at once: every HTTP socket to every piece, S3, plus 4 fds per CODE-step child process. An idle sandbox already sits around 23. Big flows (100+ steps, loops, several HTTP pieces) blow through it.

- **Do not go looking at the worker's or the host's limits** — they are irrelevant and look healthy. The worker process has 524288 and the host `fs.file-max` is effectively unbounded. The constrained process is the `sandbox-*` one, not the `node .../worker/dist/src/bootstrap.js` one.
- Raising it requires shipping a newer isolate binary (amd64 + arm) in `packages/server/api/src/assets/` and passing `--open-files`.

### Code steps (`noOpCodeSandbox`)

Each CODE step is run in a fresh `node --eval` child process spawned with `stdio: ['pipe','pipe','pipe','ipc']` (`packages/server/engine/src/lib/core/code/no-op-code-sandbox.ts`). Inputs go over IPC via `child.send(...)`, the result comes back as one message.

- **Gotchas**:
  - `TypeError: <x>.send is not a function` **on a random CODE step is fd exhaustion (**`EMFILE`**), not a code bug** — almost always the isolate 64-fd cap above. Node assigns `child.send` per-instance inside `setupChannel()`, and on `EMFILE`/`ENFILE` `ChildProcess.prototype.spawn` returns *before* that setup, so `child.send` is `undefined`. `runInChildProcess` calls it unconditionally; the synchronous `TypeError` rejects the promise first and the real `EMFILE` arriving on the `'error'` event a tick later is discarded. Only EMFILE/ENFILE do this — `EAGAIN` and `ENOENT` still define `send`. Fix shape: guard `typeof child.send !== 'function'` and return, letting the `'error'` handler reject with the true cause.
  - The masking is total: nothing reaches the logs. The worker's own wide event records `"outcome": "success"`, and the only trace anywhere is the customer's failure-alert email quoting a bogus stack. Symptom looks fleet-wide and random (many workers, many platforms, a different CODE step each time) because every sandboxed engine shares the same 64 cap.
  - No timeout or `child.kill()` on the parent side: a code step that never resolves holds its 4 fds for the life of the process.
  - `runWithExponentialBackoff` retries a failed CODE step, so an fd-starved engine re-spawns several times per step.
  - Install/compile failure degrades to a throwing stub (user-attributed FAILED, not INTERNAL_ERROR + retries).

### Workers

Node processes that poll the app over Socket.IO and execute flows. The worker *is* the sandbox — the full execution model (concurrency 1, replicas, Resolver, box lifecycle) lives on [Execution Runtime](https://craftspace.app/o/activepieces/pages/pg_xLVaOvA8hs9XVLj7kNZNE). Here, the piece-relevant behavior:

- **Version gate**: app and worker refuse to exchange jobs unless releases match exactly (fail-closed; auto-recovers once fleets converge).
- **Disconnect** returns in-flight jobs to the queue (`releaseConnectionJobs`) to avoid post-deploy "Job stalled" storms.
- **Worker groups** (`AP_WORKER_GROUP_ID` + `AP_PROJECT_WORKER`) route dedicated pools; per-project routing gated by `workerGroupsEnabled`.
- **Failed code-step** install/compile degrades to a throwing stub (user-attributed FAILED, not INTERNAL_ERROR + retries).
- Prod is deployed with Kamal from the ops box (`~/mrsk/prod`, `config/worker.yml`), not from this repo. To poke one live worker: `kamal app exec --config-file=config/worker.yml --hosts=<ip> --roles=shared05_<n> --reuse '<cmd>'`. `--reuse` is essential — without it Kamal boots a *new* container that starts taking real jobs. Dense hosts run 28 containers (one role each), so `--hosts` alone fans out. Base64 anything with pipes; quoting dies through ssh → bash -ic → kamal → docker exec → sh.

### AI Agents (gated by `agentsEnabled`)

A flow step type (`@activepieces/piece-agent`) running a ReAct-style LLM loop (up to `maxSteps`) that can call tools before producing a final answer. **No backend entity** — config lives in the flow version's step settings.

- **Tools** (`AgentTool` union): PIECE action, FLOW (child run), MCP server, KNOWLEDGE_BASE (semantic search on 768-dim embeddings). Config: `agentTools`, `structuredOutput`, `prompt`, `maxSteps`, `aiProviderModel`, optional web search.
- **Gotchas**: external MCP tools validated server-side via `POST /v1/projects/:projectId/agent-tools/mcp/validate` (initialize→initialized→tools/list handshake) through SSRF-filtered `apAxios`; errors collapse to one generic message. Lives under `agents/` (agent connecting *out*), distinct from `mcp/` (exposing AP *as* an MCP server). `AgentTimeline` renders step blocks in the builder.

## Pages

- **Pieces** — the catalog, metadata registry, versions
- **Piece Sets** — per-project include/exclude visibility, the undeletable Default set
- **Building Pieces** — authoring, testing and publishing a piece
