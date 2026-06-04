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

- `E2E_INSTANCE_URL` — target Activepieces URL (defaults to a local `localhost` value when unset)
- `E2E_EMAIL` — test user email
- `E2E_PASSWORD` — test user password

## CI

Triggered by:

- `.github/workflows/tests-e2e-ce.yml` — CE Playwright suite
- `.github/workflows/tests-e2e-ee.yml` — EE Playwright suite
- `.github/workflows/e2e-tests-checkly.yml` — scheduled Checkly run (optional)

## Related documentation

- Deep dive: `../../docs/handbook/engineering/playbooks/e2e-tests.mdx` — Page Object Model patterns, selector guidelines, debugging with Checkly, VSCode extension.
- Canonical taxonomy: `../../docs/handbook/engineering/playbooks/testing-strategy.mdx`
