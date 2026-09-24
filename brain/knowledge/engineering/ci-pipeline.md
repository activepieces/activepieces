---
icon: ⏱️
---

# CI Pipeline

The PR checks that decide whether a change builds and passes tests. Lives in `.github/workflows/ci-v2.yml` (`ci.yml` runs beside it until the side-by-side comparison ends). The gates that shape *how a PR is reviewed* are on *CI PR Review Hygiene*.

**changes job** — the first job. Runs `turbo ls --affected` to list the packages the PR touches plus everything that depends on them, and sets `all=true` when a file outside any package changed (workflows, root config, `tools/`). Every other job keys off those two outputs.

**affected** — turbo's own `--affected` filter: the dependency graph decides what runs, not path globs. A `shared` change runs api, web and worker; a piece change runs that piece and, if api depends on it, api. When turbo cannot diff, it runs everything, so the failure mode is slow, never skipped. _Avoid_: hand-written `git diff | grep pieces/` filters, the graph already knows.

**api matrix** — the api suites split one per runner (`test-ce`, `test-cloud`, `test-ee test-unit check-migrations`) and only when `api` is affected. They were the whole critical path when they shared one 4-core runner.

**setup action** — `.github/actions/setup`: node, bun, `bun install --frozen-lockfile`, turbo remote cache. Every job uses it; change install behaviour there once.

## Gotchas

- `redis-memory-server` downloads and compiles Redis from source in its postinstall (about 3 minutes, most of the old 3.5-minute `bun install`). Api tests, unit tests included, start an in-memory Redis from that binary at runtime, so skipping the postinstall (`REDISMS_DISABLE_POSTINSTALL=1`) only moves the compile into the first test that needs it and trips the 60 s and 120 s timeouts. Cache `node_modules/.cache/redis-memory-server` (keyed on the root `package.json`, which pins the version under `redisMemoryServer.version`) instead. Do not swap the in-memory Redis for the service container to avoid the compile: each vitest fork gets its own Redis today, a shared one lets parallel test files interfere.
- Every `build` task is `cache: false` in `turbo.json`, so each separate `turbo run` invocation rebuilds its whole dependency chain. Tasks that share dependencies belong in one invocation.
- Api integration tests boot the full server once per test file (`pool: forks`, isolated). The number of test files is the CI cost driver: 122 files in June 2026 → 310 in September moved the test step from 6 to 19 minutes on one runner.
- The GitHub org is on the free plan: 20 concurrent jobs org-wide, all workflows included. More jobs per PR means queueing at busy hours. `cancel-in-progress` per PR number keeps superseded runs from holding slots.
- api's `test` script runs ce+ee+cloud serially. Any `turbo run test` over many packages must exclude api (`--filter='!api'`; `tools/scripts/test-filters.ts` does the same).
- The api e2e tests (`execute-flow-e2e`, `test-step-e2e`, `piece-options-e2e`) import the worker's source, and `worker.ts` imports `@activepieces/sandbox`, which resolves to `packages/server/sandbox/dist`. A job that builds only api fails those three files with "Failed to resolve entry for package @activepieces/sandbox". The api jobs build `worker` as well and also run when worker is affected.
- A cache saved during a pull request run is visible only to that PR and to nothing else. Caches every PR should hit (bun downloads, the compiled Redis binary) must be created on `main`; `warm-ci-cache.yml` does that on every push to main.
- Two turbo invocations running at the same time in one job race on `cache: false` builds: the old `ci.yml` failed `api#build` with "@activepieces/shared has no exported member" for a member that exists, because a second invocation was rewriting `shared/dist` while api's tsc read it. One invocation per job.
- `--affected` and `--filter` intersect in turbo; there is no union flag. To run "the affected packages plus this fixed set" in one invocation, pass the affected names (the `changes` job outputs them as JSON) as explicit `--filter=<name>` arguments alongside the fixed ones. Two invocations rebuild the shared dependency chain twice because `build` is uncached.
- A PR that edits `core-piece-types`, `core-utils`, `core-formula`, `core-execution`, `pieces-framework` or `pieces-common` marks every piece affected, because every piece imports them through the framework. `lint` then lints and `build-test` builds all 700+ pieces, about 20 minutes. That is the graph being right, not a bug; the old `ci.yml` only did this for framework or common changes. The cheap way out is the turbo remote cache for piece `build` and `lint`, not a filter.
- `TURBO_SCM_BASE` must be `origin/<base branch>` in CI. turbo's default base is `main`, which a CI checkout does not have, so without it every run degrades to "everything affected".

## Key files

- `.github/workflows/ci-v2.yml` — the PR pipeline
- `.github/actions/setup` — shared install and cache steps
- `tools/scripts/test-filters.ts` — every package with a `test` script, minus api
- `tools/scripts/check-migration-rollback.ts` — new migrations must declare `breaking` and `down()`
