---
icon: 🚦
---

# CI PR Review Hygiene

The CI gates that shape *how a PR is reviewed*, as opposed to whether it builds. Lives in `.github/workflows/`.

## Draft-first flow
We open PRs as drafts so no human reviewer is auto-assigned until "Ready for review". Greptile's **Review draft pull requests** setting is enabled, so its first pass lands on draft open with no CI glue — first-pass AI review while it is still a draft, human review after. Unlike a once-per-PR CI nudge, the native setting also re-reviews as commits land on the draft.

## Per-area size gate
`pr-size.yml` + `tools/scripts/pr-size-check.ts` count **meaningful lines** (additions + deletions, minus lockfiles, `i18n/translation.json`, `locales/**`, snapshots, `dist`) per area and fail when a gated area is over budget: engine+worker+execution combined 300, `core/shared` 250, `server/api` 600, `packages/web` 1200. `packages/pieces` and everything unmatched are measured but exempt — a line count can't tell a cohesive new piece from a codemod, and pieces are self-contained with low blast radius. Bypass with the `large-pr-ok` label or a `revert:` title. Budgets were calibrated from the distribution of recently merged PRs.

The diff comes from local `git diff --numstat`, not the `/files` API, so it is immune to GitHub's 3,000-file response cap — a mega-PR cannot under-count its way past the gate.

## Gotchas
- **A red check does not block a merge.** The gate only prevents merges once `PR size` is added as a **required status check** for `main` in branch protection. Until then it is visible but advisory.
- **Workflow actions are pinned to major-version tags, not SHAs** (`actions/checkout@v5`, `oven-sh/setup-bun@v2`). The only SHA pins live in the CodeQL security workflow. Reviewers — human and AI — regularly suggest SHA-pinning a single new workflow; decline it. Moving to SHA pinning is a repo-wide policy call, and a half-pinned `.github/` is worse than a consistent one.
- **`redis-memory-server` compiles Redis from source during `bun install`, so its version must stay pinned.** It is in `trustedDependencies`, and with no version configured it defaults to `stable` — whatever `download.redis.io/redis-stable.tar.gz` points at today. When that moved to Redis 8, the bundled module tree (redistimeseries, LibMR, libevent, jemalloc) started failing to build on runners and took `bun install` down across every branch. It reads as flakiness because `ci.yml` caches `~/.bun/install/cache` but not the compiled binary, so each run recompiles and only sometimes survives. Root `package.json` now pins `redisMemoryServer.version`; bump it deliberately, never back to `stable`.
- **`tools/scripts/` is outside the lint and test wiring.** ESLint ignores it, and `npm run test-unit` only covers engine/shared/web. A script there with real policy logic must run its own tests from its own workflow — `pr-size.yml` runs `bun test tools/scripts/pr-size-check.test.ts` as a step before the check itself.
