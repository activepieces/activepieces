# Activepieces API Tests

This directory contains all tests for the `@activepieces/server-api` package, organised into a unit layer and an integration layer under the monorepo's canonical 4-layer testing taxonomy (unit / integration / e2e / smoke).

## Taxonomy mapping

| Path | Layer | What it covers |
|---|---|---|
| `test/unit/` (23 files) | **Unit** | Single-module logic — services, helpers, middleware guards, schema validators. Mocks allowed, no real DB/queue. |
| `test/integration/ce/` (~30 files) | **Integration** | Fastify `.inject()` + real Postgres + real Redis + real BullMQ, Community Edition endpoints |
| `test/integration/ee/` (~12 files) | **Integration** | Same infra as CE; Enterprise-only endpoints (SSO, SAML, SCIM) |
| `test/integration/cloud/` (~35 files) | **Integration** | Same infra as CE; cloud-only endpoints + role-based permission matrices |

The edition split (ce / ee / cloud) is a product-edition gate, not a separate taxonomy layer — all three subtrees are integration tests.

## Test utilities

Key helpers live under `test/helpers/`:

- `setupTestEnvironment()` — boots a shared singleton Fastify app + database for the whole file; DB truncated between tests via `beforeEach`. Pass `{ fresh: true }` when tests need isolated module spying.
- `createTestContext(app, params)` — creates a user, platform, project, auth token; returns `{ user, platform, project, token, get/post/put/delete/inject }`.
- `createMemberContext(parentCtx, { projectRole })` — creates a member user under the same platform/project with a specific role.
- `createServiceContext(parentCtx)` — creates an API key for service-to-service auth.
- `mocks/index.ts` — ~850 LOC of factory builders (e.g., `createMockFlow`, `createMockFlowVersion`, `mockAndSaveBasicSetup`, `generateMockToken`) using `@faker-js/faker`.

## Running the tests

```bash
npm run test             # runs test-ce && test-ee && test-cloud sequentially
npm run test-unit        # vitest run test/unit --bail 1
npm run test-ce          # loads .env.tests, AP_EDITION=ce, runs test/integration/ce
npm run test-ee          # same, AP_EDITION=ee, runs test/integration/ee
npm run test-cloud       # same, runs test/integration/cloud
```

Integration tests require a running Postgres + Redis (see `.env.tests`).

## Classification debt

- **`test/unit/app/core/canary/canary-proxy.integration.test.ts`** — already carries an `.integration.` infix but lives under `test/unit/`. Spins up two real Fastify instances listening on real TCP ports and routes requests between them. Target: move to `test/integration/ce/core/canary/` and drop the redundant `.integration.` infix.
- **`test/integration/ce/authentication/password-hasher.test.ts`** — pure bcrypt + legacy scrypt logic. No `setupTestEnvironment`, no DB, no Fastify app, no `createTestContext`. Target: move to `test/unit/app/authentication/`.
- **Duplication: `test/integration/ce/flows/flow/flow.test.ts` and `test/integration/cloud/flow/flow.test.ts`** — both exercise identical "Create flow" shapes and assertions; only role-permission checks differ in the cloud copy. Target: extract the shared CRUD assertions into the CE file (the common base) and keep only cloud-specific role permutations under `cloud/`.

This list is a backlog, not a to-do for this README. Items should be tackled opportunistically when touching the affected tests.

## Related documentation

- Canonical taxonomy: `../../../../docs/handbook/engineering/playbooks/testing-strategy.mdx` (repo-relative path — works from GitHub UI before the handbook PR is deployed).
- Full-stack browser E2E (not covered here): `../../../../docs/handbook/engineering/playbooks/e2e-tests.mdx`
