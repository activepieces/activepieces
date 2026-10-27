# Activepieces E2E Tests

This package holds the monorepo's full-stack end-to-end tests. Under the canonical 4-layer testing taxonomy (unit / integration / e2e / smoke), this is the only package that owns the E2E layer: Playwright-driven browser flows that exercise the entire Activepieces stack through the public UI. Per-package unit and integration tests live in their respective packages (`packages/server/api/test/`, `packages/server/engine/test/`, `packages/server/worker/test/`).

## Layout

```
packages/tests-e2e/
├── scenarios/
│   ├── ce/         # Community Edition specs (*.spec.ts)
│   └── ee/         # Enterprise Edition specs (*.spec.ts)
├── pages/          # Page Object Models (base.ts, flows.page.ts, builder.page.ts, ...)
├── helper/         # Config and env utilities
├── playwright.config.ts
└── project.json    # Nx project config
```

## Running the tests

```bash
# Local Playwright run
npm run test:e2e

# Checkly (video recordings — preferred for debugging)
npx turbo run test-checkly --filter=tests-e2e

# Deploy to Checkly (CI does this automatically)
npx turbo run deploy-checkly --filter=tests-e2e
```

## Environment

Required environment variables:

- `E2E_INSTANCE_URL` — target Activepieces URL (defaults to `http://localhost:4200` and starts the dev server when unset). When set, global setup deletes every flow of the signed-in account, so use an account that exists only for E2E.
- `E2E_EMAIL` — test user email
- `E2E_PASSWORD` — test user password

## CI

PRs do not run E2E unless they change the suite or carry the `ready-for-e2e` label. Staging and the release candidate run it.

- `.github/workflows/e2e-matrix.yml` — the only E2E suite that gates a release: builds the image and runs the suite in four CE/EE configurations. Runs on PRs that touch `packages/tests-e2e/**`, and from the Cloud gate.
- `.github/workflows/e2e.yml` — runs `e2e-matrix.yml` on a PR with the `ready-for-e2e` label, and again on each push while the label stays
- `.github/workflows/continuous-delivery-stg.yml` — runs the CE specs against staging after each deploy
- `.github/workflows/e2e-tests-checkly.yml` — scheduled Checkly run (optional)

## Related documentation

- Deep dive: `../../docs/handbook/engineering/playbooks/e2e-tests.mdx` — Page Object Model patterns, selector guidelines, debugging with Checkly, VSCode extension.
- Canonical taxonomy: `../../docs/handbook/engineering/playbooks/testing-strategy.mdx`
