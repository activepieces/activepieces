# Activepieces E2E Tests

This package holds the monorepo's full-stack end-to-end tests. Under the canonical 4-layer testing taxonomy (unit / integration / e2e / smoke), this is the only package that owns the E2E layer: Playwright-driven browser flows that exercise the entire Activepieces stack through the public UI. Per-package unit and integration tests live in their respective packages (`packages/server/api/test/`, `packages/server/engine/test/`, `packages/server/worker/test/`).

## Layout

```
packages/tests-e2e/
├── scenarios/      # Specs (*.spec.ts) for every edition
│   ├── ce/         # Community Edition only
│   └── ee/         # Enterprise Edition only (skipped when AP_EDITION=ce)
├── pages/          # Page objects (automations, builder, runs, authentication)
├── fixtures/       # Test fixtures, the session file and API cleanup helpers
├── global-setup.ts # Signs in once and saves the session to .auth/user.json
└── playwright.config.ts
```

## Writing a spec

A spec must pass whatever the project already holds: nothing, many flows, or another run's flows.

- Create what the spec needs, and name each flow and connection with `e2eFlows.uniqueName()` (prefix `E2E `).
- Pass each flow id to `flowCleanup.track()` and each connection id to `connectionCleanup.track()`. The fixtures delete them after the test, also when the test fails.
- Find your data by its id or unique name, never by its position in a list.
- Wait for a visible result (a status text, a step output, a response), never for a fixed time.
- Select by role and accessible name (`getByRole(…, { name })`, `getByLabel`). When an element has no name, give it one in the web app (a linked label or an `aria-label`); use a `data-testid` only when no name fits. Never locate a field by the text around it or by its position.
- The tests start signed in. Use `test.use({ storageState: { cookies: [], origins: [] } })` to start signed out.
- Use only pieces that need no outside service. A spec that needs a server calls a flow of its own, as `connection-step.spec.ts` does.
- A new piece must also go into the `PIECES` list of `e2e-matrix.yml`, because the matrix stack installs only those.

## Flaky specs

A spec is flaky when it fails and then passes on a retry, or fails with no product bug. The run summary counts flaky specs.

1. Open a Linear ticket for the spec.
2. Add the `@quarantine` tag and the ticket to the spec: `test('…', { tag: '@quarantine', annotation: { type: 'issue', description: '<ticket URL>' } }, …)`.
3. CI skips `@quarantine` specs, so the release gate does not wait for the fix. Local runs still run them.
4. The fix removes the tag in the same PR.

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

- `E2E_INSTANCE_URL` — target Activepieces URL (defaults to `http://localhost:4200` and starts the dev server when unset). Global setup deletes `E2E `-prefixed flows and connections older than one hour, which crashed runs leave behind. It does not touch other flows or connections.
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
