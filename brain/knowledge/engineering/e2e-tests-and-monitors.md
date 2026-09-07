---
icon: 🎭
---

# E2E Tests & Monitors

One Playwright suite in `packages/tests-e2e` feeds three consumers that fail independently: CI on a fresh throwaway instance, Checkly monitors against **production Cloud**, and a single BetterStack monitor. A change that only breaks one of them looks green everywhere else, so it is worth knowing which reads what.

**Local / CI suite** — `playwright.config.ts`, `testMatch: **/*.spec.ts`, split by `AP_EDITION` into `scenarios/ce` and `scenarios/ee`. Boots the whole stack itself via the `webServer` block.
**Checkly monitors** — `checkly.config.ts` picks up the *same* `**/scenarios/**/*.spec.ts` files and runs them every 10 minutes with `baseURL: https://cloud.activepieces.com`, signing in with `E2E_EMAIL` / `E2E_PASSWORD`.
**BetterStack monitor** — one standalone file, `scenarios/betterstack/*.flat.spec.js`.

## Gotchas

- **Checkly runs the shared specs against production Cloud**, so anything the page objects assume about the login screen has to hold on Cloud too — not just on the SMTP-less instance CI boots. This is the usual reason a UI change breaks the monitors but not CI. See the auth-card gotchas on [CE Authentication](../connections-auth/ce-authentication.md).
- **BetterStack does not read the repo — the repo pushes to it.** `.github/workflows/sync-betterstack-playwright.yml` fires on push to `main` and `PATCH`es the file's contents into the hardcoded monitor `4211060` as `playwright_script`. One-way and `main`-only: the monitor updates at *merge*, never on the PR, and any edit made in the BetterStack UI is silently overwritten by the next push.
- **The BetterStack file is deliberately flat and duplicated.** BetterStack executes one self-contained script, so it cannot `require` the `pages/` objects — its sign-in is a copy. Fix the page object and you have *not* fixed the monitor; both files need the change.
- **The `.flat.spec.js` runs nowhere else.** Playwright matches `*.spec.ts` and Checkly matches `**/scenarios/**/*.spec.ts`, so a broken flat file is invisible locally and in CI until it fails in BetterStack.
- **CI only runs on the `ready-for-e2e` label** (`e2e.yml` gates both edition workflows on it), which is why the suite can rot for weeks without anyone noticing.
- **Turbo strict env mode silently strips most of `.env.e2e`.** `globalPassThroughEnv` in `turbo.json` is an allow-list, so vars not named there never reach the `serve` tasks — verify with `tr '\0' '\n' < /proc/<api-pid>/environ`. `AP_ENVIRONMENT` is among the casualties, so CI falls back to the `prod` default. Widening it to `AP_*` does forward them, but that alone broke worker→API Socket.IO auth (jobs queue up unconsumed), so the passthrough and the worker's `AP_WORKER_TOKEN` have to be sorted out together.
- **`AP_DEV_PIECES` loads from `packages/pieces/**/dist`, which `npm run dev` does not build.** Only pieces that happen to be build dependencies of api/worker have a `dist`, so a default dev instance serves **0 pieces** and every spec that picks a trigger times out on the piece search. Build them explicitly: `npx turbo run build --filter=@activepieces/piece-webhook --filter=@activepieces/piece-store`.
- **CE sign-up is invitation-only once a platform exists** (`INVITATION_ONLY_SIGN_UP`), so the suite's sign-up path only works on a genuinely fresh instance. Against a dev-seeded database, set `E2E_EMAIL` / `E2E_PASSWORD` instead — `global-setup.ts` prefers them and signs in rather than signing up.
- **Every workspace declares its own deps.** `@faker-js/faker` was imported by the page objects for months while only `server/api` declared it; under Bun's isolated linker that means the suite cannot import its own page objects at all.

## Key files
- `packages/tests-e2e` — `playwright.config.ts` (local/CI), `checkly.config.ts` (Cloud monitors), `global-setup.ts` (provisions or signs in the seed account), `pages/` (shared page objects), `scenarios/betterstack/` (the standalone monitor script)
- `.github/workflows/e2e.yml` — the `ready-for-e2e` gate that calls the per-edition workflows
- `.github/workflows/sync-betterstack-playwright.yml` — the push-to-`main` upload
