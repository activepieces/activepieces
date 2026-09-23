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

- `redis-memory-server` downloads and compiles Redis from source in its postinstall on every `bun install`. CI tests use the Redis service container, so the workflow sets `REDISMS_DISABLE_POSTINSTALL=1`. Do not set it where `AP_REDIS_TYPE=MEMORY` is actually used.
- Every `build` task is `cache: false` in `turbo.json`, so each separate `turbo run` invocation rebuilds its whole dependency chain. Tasks that share dependencies belong in one invocation.
- Api integration tests boot the full server once per test file (`pool: forks`, isolated). The number of test files is the CI cost driver: 122 files in June 2026 → 310 in September moved the test step from 6 to 19 minutes on one runner.
- The GitHub org is on the free plan: 20 concurrent jobs org-wide, all workflows included. More jobs per PR means queueing at busy hours. `cancel-in-progress` per PR number keeps superseded runs from holding slots.
- api's `test` script runs ce+ee+cloud serially. Any `turbo run test` over many packages must exclude api (`--filter='!api'`; `tools/scripts/test-filters.ts` does the same).
- `TURBO_SCM_BASE` must be `origin/<base branch>` in CI. turbo's default base is `main`, which a CI checkout does not have, so without it every run degrades to "everything affected".

## Key files

- `.github/workflows/ci-v2.yml` — the PR pipeline
- `.github/actions/setup` — shared install and cache steps
- `tools/scripts/test-filters.ts` — every package with a `test` script, minus api
- `tools/scripts/check-migration-rollback.ts` — new migrations must declare `breaking` and `down()`
