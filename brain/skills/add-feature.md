---
name: add-feature
description: Use when adding a feature spanning database, API, and frontend in Activepieces. ALWAYS use for multi-layer feature work.
---

# Add Feature End-to-End

Full-stack feature workflow in Activepieces.

**Step 0 — Decide scope**: CE/EE/both (both → `hooksFactory`, CE default + EE override in `app.ts`)? Need a plan flag (add to `PlatformPlan` + `LicenseKeyEntity` + plan constants)? Need a `Permission`? Billing/quotas? Must work embedded (`EmbeddingState`)? Project- vs platform-scoped?

**Step 1 — Shared types** (`packages/core/shared`): Zod schemas + `z.infer` types in `src/lib/{domain}/`, export from barrel, bump `package.json` version (patch=fix, minor=new export).

**Step 2 — Server** (`packages/server/api`): read `.agents/features/<module>.md` first.
- Entity: `EntitySchema` + `BaseColumnSchemaPart` + `ApIdSchema`.
- Register entity in `getEntities()` in `database-connection.ts` (REQUIRED — no auto-discover).
- Migration: playbook → class → import in `postgres-connection.ts` → add to `getMigrations()` → PGlite guard.
- Service, Controller (route configs after controller, `securityAccess` required), `entitiesMustBeOwnedByCurrentProject` hook, register module in `app.ts`.
- EE-only → `src/app/ee/`, gate with `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)`.
- Side effects → separate `*-side-effects.ts`.

**Step 3 — Worker** (if queued): add to `SystemJobName`/`WorkerJobType`, register handler in `app.ts`.

**Step 4 — Frontend** (`packages/web`): feature folder `src/features/{feature}/{api,hooks,components}`. Route via `React.lazy()` + `ProjectRouterWrapper()` + `RoutePermissionGuard` + `SuspenseWrapper`. Translations only in `public/locales/en/translation.json`. Flags via `flagsHooks.useFlag()` / `<FlagGuard>`.

**Step 5 — Tests**: `test/integration/ce/{feature}.test.ts` with `setupTestEnvironment()` + `createTestContext(app)`.

**Step 6 — Verify**: `npm run lint-dev` && `npm run test-api`.

Full procedure in the repo: `.agents/skills/add-feature/SKILL.md`
