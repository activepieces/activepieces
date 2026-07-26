---
icon: 🧪
---

# Gotcha: engine vitest needs fresh core-execution dist + can't load piece dist locally

Two traps when running `packages/server/engine` vitest tests locally.

**1. Stale `core-execution` dist → enums are `undefined` at runtime.** Enums like `LoopBatchMode` are defined in `@activepieces/core-execution` and re-exported via `@activepieces/shared` (`export * from '@activepieces/core-execution'`). The engine vitest config aliases `@activepieces/shared` to source but that source pulls `core-execution` from its **dist**. If you add an enum/value there and don't rebuild, tests fail with `Cannot read properties of undefined (reading 'ITEMS_PER_BATCH')` — even the PR's own tests. Fix: `npx turbo run build --filter=@activepieces/core-execution` before running engine tests. (CI's turbo dep graph handles this; local ad-hoc runs don't.)

**2. Tests that load a real piece (delay, approval, http…) fail locally.** The piece-loader does `await import('<abs>/pieces/core/<x>/dist/src/index.js')`. vite-node can't resolve that absolute built path → `ERR_MODULE_NOT_FOUND`, even though plain `node` imports the same file fine. Reproduces under both node and bun. So `flow-with-delay.test.ts`, `flow-with-pause.test.ts` etc. fail on any dev machine, not just a given branch — they only go green in CI. Don't chase this as a bug in your change; verify piece-free logic (e.g. `flow-looping.test.ts`) locally and rely on CI for piece-loading tests.
