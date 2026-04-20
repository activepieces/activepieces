---
name: add-feature
description: "Use when the user asks to add a feature, implement functionality, or build something spanning database, API, and frontend. ALWAYS use for multi-layer feature work."
---

# Add Feature End-to-End

Implement feature described in $ARGUMENTS across the full stack.

## Step 0: Decide Scope

Before writing code, answer:
1. **CE, EE, or both?** If both → use `hooksFactory` (CE default + EE override in `app.ts`)
2. **Need a plan flag?** → Add to `PlatformPlan` entity + `LicenseKeyEntity` type + plan constants in shared
3. **Need a Permission?** → Add to `Permission` enum in shared
4. **Affects billing/quotas?** → Add enforcement in controller
5. **Must work embedded?** → Check `EmbeddingState` in frontend
6. **Project-scoped or platform-scoped?** → Filter queries accordingly

## Step 1: Shared Types (`packages/shared`)

- Define Zod schemas + `z.infer` types in `src/lib/{domain}/`
- Export from `src/index.ts` barrel
- Bump version in `package.json` (patch for fix, minor for new export)

## Step 2: Server (`packages/server/api`)

Read `.agents/features/<module-name>.md` first (e.g. `.agents/features/tables.md` for the tables module).

- **Entity**: Use `EntitySchema` + `BaseColumnSchemaPart` + `ApIdSchema`. See `tables/table/table.entity.ts`.
- **Register entity**: Add to `getEntities()` in `database-connection.ts` (REQUIRED — TypeORM doesn't auto-discover)
- **Migration**: Read playbook → create class → import in `postgres-connection.ts` → add to `getMigrations()` → handle PGlite
- **Service**: Factory `(log: FastifyBaseLogger) => ({...})` if logging needed, plain object otherwise. See `tables/table/table.service.ts`.
- **Controller**: `FastifyPluginAsyncZod`. Route configs AFTER controller. `securityAccess` required. See `tables/table/table.controller.ts`.
- **Project ownership**: Add `entitiesMustBeOwnedByCurrentProject` hook if returning project-scoped data
- **Module**: Register in `app.ts` (CE or EE section)
- **EE-only**: Put in `src/app/ee/`, gate with `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)`
- **Side effects**: Separate `*-side-effects.ts` file if mutations trigger events/webhooks

## Step 3: Worker (if queued work needed)

- Add to `SystemJobName` or `WorkerJobType` enum in shared
- Add handler, register in `app.ts` via `systemJobHandlers.registerJobHandler()`

## Step 4: Frontend (`packages/web`)

- Feature folder: `src/features/{feature}/api/`, `hooks/`, `components/`
- API client: See `features/tables/api/tables-api.ts`
- Hooks: See `features/tables/hooks/table-hooks.ts`
- Route: `React.lazy()` + `ProjectRouterWrapper()` + `RoutePermissionGuard` + `SuspenseWrapper`
- Translations: `packages/web/public/locales/en/translation.json` only
- Feature flags: `flagsHooks.useFlag()` or `<FlagGuard>`

## Step 5: Tests

- API test: `packages/server/api/test/integration/ce/{feature}.test.ts`
- Use `setupTestEnvironment()` + `createTestContext(app)`

## Step 6: Verify

```bash
npm run lint-dev
npm run test-api
```
