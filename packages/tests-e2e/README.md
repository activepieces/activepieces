# Activepieces E2E Tests

This package holds the monorepo's full-stack end-to-end tests. Under the canonical 4-layer testing taxonomy (unit / integration / e2e / smoke), this is the only package that owns the E2E layer: Playwright-driven browser flows that exercise the entire Activepieces stack through the public UI. Per-package unit and integration tests live in their respective packages (`packages/server/api/test/`, `packages/server/engine/test/`, `packages/server/worker/test/`).

## Layout

```
packages/tests-e2e/
├── scenarios/      # Specs (*.spec.ts) for every edition
│   ├── ce/         # Community Edition only
│   ├── ee/         # Enterprise Edition only (skipped when AP_EDITION=ce)
│   └── cloud/      # Cloud only (runs only when AP_EDITION=cloud)
├── pages/          # Page objects (automations, builder, runs, authentication, platform switcher)
├── fixtures/       # Test fixtures, the session file and API cleanup helpers
├── global-setup.ts # Signs in once and saves the session to .auth/user.json
└── playwright.config.ts
```

## Writing a spec

This section is the one set of E2E guidelines, for people and agents. Other pages link here instead of repeating it.

Staging runs the CE specs in a shared, long-lived account after each deploy, and CI runs specs in parallel in one project, so a spec must pass whatever the project already holds: nothing, many flows, or another run's flows. It must never change data it did not create.

Start from `scenarios/flows/flow-journey.spec.ts` and `pages/builder.page.ts`. Locators and actions live in a page object under `pages/`; the spec holds the steps and the expected outcomes.

### Data

- Create what the spec needs, and name each flow and connection with `e2eFlows.uniqueName()` (prefix `E2E `).
- Pass each flow id to `flowCleanup.track()` and each connection id to `connectionCleanup.track()`. The fixtures delete them after the test, also when the test fails.
- Delete only by the ids your test created. Never delete by a query, a name, or a prefix.
- Find your data by its id or unique name, never by its position in a list.
- The tests start signed in. Use `test.use({ storageState: { cookies: [], origins: [] } })` to start signed out.
- Use only pieces that need no outside service. A spec that needs a server calls a flow of its own, as `connection-step.spec.ts` does.
- A new piece must also go into the `PIECES` list of `e2e-matrix.yml`, because the matrix stack installs only those.
- A spec that reads the mail the app sends uses the `mailbox` fixture and lives under `scenarios/ee/`, because only the EE configs of `e2e-matrix.yml` run the mail catcher. Give each user its own address: other specs read the same catcher.

### Selecting elements

- Select by test id (`getByTestId`). When the element has none, add a `data-testid` in `packages/web` in the same PR. Name it in kebab-case, area first: `sign-in-email`, `test-step-button`.
- Use role and accessible name (`getByRole(…, { name })`, `getByLabel`) only where a test id does not fit, such as a row you find by the unique name of your data.
- Never select by a CSS class, XPath, the text around a field, or a position (`nth()`, `first()`, `last()`).
- A test id does not replace a role and an accessible name. When you add one, also follow "Accessible markup" in `packages/web/AGENTS.md`.

### Waiting and asserting

- Wait for a visible result with a web-first assertion (`await expect(locator).toBeVisible()`), or for the API call with `page.waitForResponse()`. Never wait for a fixed time, `waitForSelector`, or `networkidle`.
- Assert the outcome the ticket asks for, such as a run status, a step output, or a webhook response. A visible page or button is not an outcome.
- Keep `if` out of specs. A spec runs the same steps on every run, so a green run always proves the same thing.
- A page object may branch only when the app can correctly be in either of two states and the spec cannot choose which, such as an empty project or one with flows (see `AutomationsPage.createFlow`). Never branch to work around a bug or a flaky step: that hides the failure the spec exists to catch.
- Name a page object method that asserts `expect…`, so lint counts it as an assertion.

### Proving the spec

- Run the spec. Show it fail without your change (or against the bug), then pass with it. Put both results in the PR.
- When a spec fails, find the cause first: the app, the spec, or the environment. Never loosen a locator, remove an assertion, or change an expected value to match what the screen shows now.
- Never skip a spec with `test.skip` or `test.fixme` to get a green run. A flaky spec follows [Flaky specs](#flaky-specs).
- `npx turbo run lint --filter=tests-e2e` checks specs, page objects and fixtures with `eslint-plugin-playwright`.

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
```

## Environment

Required environment variables:

- `E2E_INSTANCE_URL` — target Activepieces URL (defaults to `http://localhost:4200` and starts the dev server when unset). Global setup deletes `E2E `-prefixed flows and connections older than one hour, which crashed runs leave behind. It does not touch other flows or connections.
- `E2E_EMAIL` — test user email
- `E2E_PASSWORD` — test user password
- `E2E_MAIL_URL` — the web port of a [Mailpit](https://mailpit.axllent.org) catcher, such as `http://localhost:8025`. The specs that read mail need it. For a local run, start `docker run -d -p 1025:1025 -p 8025:8025 -e MP_SMTP_AUTH_ACCEPT_ANY=true -e MP_SMTP_AUTH_ALLOW_INSECURE=true axllent/mailpit`, and start the app with `AP_SMTP_HOST=localhost`, `AP_SMTP_PORT=1025`, `AP_SMTP_SENDER_EMAIL`, and any `AP_SMTP_USERNAME` and `AP_SMTP_PASSWORD`.

## CI

PRs do not run E2E unless they change the suite or carry the `ready-for-e2e` label. Staging and the release candidate run it.

- `.github/workflows/e2e-matrix.yml` — the only E2E suite that gates a release: builds the image and runs the suite in four CE/EE configurations. Runs on PRs that touch `packages/tests-e2e/**`, and from the Cloud gate.
- `.github/workflows/e2e.yml` — runs `e2e-matrix.yml` on a PR with the `ready-for-e2e` label, and again on each push while the label stays
- `.github/workflows/continuous-delivery-stg.yml` — runs the CE specs against staging after each deploy
- `.github/workflows/emergency-cloud-deploy.yml` — the only workflow that deploys the specs to Checkly, by hand. Nothing calls `e2e-tests-checkly.yml`, so Checkly runs the specs from its last deploy, not the specs on `main`.

## Related documentation

- Debugging a failed spec: `../../docs/handbook/engineering/playbooks/e2e-tests.mdx`
- Gotchas of the suite, Checkly and BetterStack: `../../brain/knowledge/engineering/e2e-tests-and-monitors.md`
- Canonical taxonomy: `../../docs/handbook/engineering/playbooks/testing-strategy.mdx`
