---
icon: 🎭
---

# E2E Tests & Monitors

One Playwright suite in `packages/tests-e2e` feeds three consumers that fail independently: CI on a fresh throwaway instance, Checkly monitors against **production Cloud**, and a single BetterStack monitor. A change that only breaks one of them looks green everywhere else, so it is worth knowing which reads what.

**Local / CI suite** — `playwright.config.ts` runs every `scenarios/**/*.spec.ts`; `AP_EDITION=ce` skips `scenarios/ee`. Boots the whole stack itself via the `webServer` block unless `E2E_INSTANCE_URL` is set. Global setup signs in once and saves the session to `.auth/user.json`, so specs start signed in.
**Checkly monitors** — `checkly.config.ts` picks up the *same* `**/scenarios/**/*.spec.ts` files and runs them every 10 minutes with `baseURL: https://cloud.activepieces.com`, signing in with `E2E_EMAIL` / `E2E_PASSWORD`.
**BetterStack monitor** — one standalone file, `scenarios/betterstack/*.flat.spec.js`.

## Gotchas

- **Checkly runs the shared specs against production Cloud**, so anything the page objects assume about the login screen has to hold on Cloud too — not just on the SMTP-less instance CI boots. This is the usual reason a UI change breaks the monitors but not CI. See the auth-card gotchas on [CE Authentication](../connections-auth/ce-authentication.md).
- **BetterStack does not read the repo — the repo pushes to it.** `.github/workflows/sync-betterstack-playwright.yml` fires on push to `main` and `PATCH`es the file's contents into the hardcoded monitor `4211060` as `playwright_script`. One-way and `main`-only: the monitor updates at *merge*, never on the PR, and any edit made in the BetterStack UI is silently overwritten by the next push.
- **The BetterStack file is deliberately flat and duplicated.** BetterStack executes one self-contained script, so it cannot `require` the `pages/` objects — its sign-in is a copy. Fix the page object and you have *not* fixed the monitor; both files need the change.
- **The `.flat.spec.js` runs nowhere else.** Playwright matches `*.spec.ts` and Checkly matches `**/scenarios/**/*.spec.ts`, so a broken flat file is invisible locally and in CI until it fails in BetterStack.
- **PRs do not run E2E unless they touch the suite or carry `ready-for-e2e`.** `e2e-matrix.yml` runs on its own only when `packages/tests-e2e/**` or its compose files change, so an unlabeled server change merges with no E2E check and the first signal is staging. A missing check is not a pass. The label makes `e2e.yml` call the same matrix.
- **The label runs on `pull_request`, not `pull_request_target`.** A fork PR gets no `EE_LICENSE_KEY`, so its two EE configs fail; read the CE ones. Do not move the trigger back to `pull_request_target` to "fix" that: it hands PR code the secret.
- **Turbo strict env mode silently strips most of `.env.e2e`.** `globalPassThroughEnv` in `turbo.json` is an allow-list, so vars not named there never reach the `serve` tasks — verify with `tr '\0' '\n' < /proc/<api-pid>/environ`. `AP_ENVIRONMENT` is among the casualties, so CI falls back to the `prod` default. Widening it to `AP_*` does forward them, but that alone broke worker→API Socket.IO auth (jobs queue up unconsumed), so the passthrough and the worker's `AP_WORKER_TOKEN` have to be sorted out together.
- **`AP_DEV_PIECES` loads from `packages/pieces/**/dist`, which `npm run dev` does not build.** Only pieces that happen to be build dependencies of api/worker have a `dist`, so a default dev instance serves **0 pieces** and every spec that picks a trigger times out on the piece search. Build them explicitly: `npx turbo run build --filter=@activepieces/piece-webhook --filter=@activepieces/piece-store`.
- **CE sign-up is invitation-only once a platform exists** (`INVITATION_ONLY_SIGN_UP`), so the suite's sign-up path only works on a genuinely fresh instance. Against a dev-seeded database, set `E2E_EMAIL` / `E2E_PASSWORD` instead — `global-setup.ts` prefers them and signs in rather than signing up.
- **Every workspace declares its own deps.** `@faker-js/faker` was imported by the page objects for months while only `server/api` declared it; under Bun's isolated linker that means the suite cannot import its own page objects at all.
- **`npx playwright test` can resolve a globally installed Playwright** instead of the repo's, and the two copies fail with `Playwright Test did not expect test.describe() to be called here` on *every* spec, including ones that have not been touched. The message points at your file and the cause is elsewhere. Run `./node_modules/.bin/playwright test --config=packages/tests-e2e/playwright.config.ts` instead.
- **Specs own their data.** Each flow a spec makes is named `E2E …` and deleted by the `flowCleanup` fixture, also on failure; global setup only sweeps `E2E ` flows older than an hour. The old setup deleted every flow, which put staging in the empty state on every run and once wiped a shared account.
- **Automations renders "Create New" while it loads, then may swap to the empty state.** Clicking it during the load opens a menu that disappears. `AutomationsPage.createFlow` waits for `automations-loading` to detach before it picks an entry.
- **"Test Flow" does not flush pending edits.** Step edits save through a 1 s debounce, and a test run started inside that window runs the old draft. The page object waits for the `POST /api/v1/flows/<id>` save after each edit; Publish flushes on its own.
- **Playwright sees every button in the builder breadcrumb as disabled.** `BreadcrumbPage` renders `role="link" aria-disabled="true"`, which Playwright inherits, so the flow menu button never clicks. Click the flow name text to rename instead.
- **Checkly runs no global setup.** It matches the same `*.spec.ts` files, so a spec that relies on the saved session fails there.
- **A spec that needs a live third-party connection cannot live in `scenarios/`.** Checkly and CI both pick up every `*.spec.ts` there, and neither has the connection, so it fails for everyone but its author. Keep piece-connection specs outside the repo and pin the regression in the piece's own unit tests instead.

## Key files
- `packages/tests-e2e` — `playwright.config.ts` (local/CI), `checkly.config.ts` (Cloud monitors), `global-setup.ts` (signs in or signs up, saves the session, sweeps stale `E2E ` flows), `fixtures/` (`flowCleanup`, `e2eFlows`), `pages/` (shared page objects), `scenarios/betterstack/` (the standalone monitor script)
- `.github/workflows/e2e-matrix.yml` — the only E2E suite that gates a release: the built image in four CE/EE configurations
- `.github/workflows/e2e.yml` — the `ready-for-e2e` label trigger for that matrix
- `.github/workflows/sync-betterstack-playwright.yml` — the push-to-`main` upload
