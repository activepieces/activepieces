# Activepieces

Open-source AI-first workflow automation platform. Self-hosted or cloud. 400+ pieces. MCP support.

## Architecture (Non-Obvious Rules)

- **Multi-tenant**: Platform → Projects → Users. ALL queries MUST filter by `projectId` or `platformId`.
- **Editions**: CE (`ce`), EE (`ee`), Cloud (`cloud`) via `AP_EDITION`. EE extends CE via `hooksFactory` — **never import `src/app/ee/` in CE code**.
- **Feature gating**: `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)` on EE modules.
- **Entity registration**: New entities MUST be added to `getEntities()` in `database-connection.ts` — TypeORM does NOT auto-discover.
- **HTTP**: `POST` for all create/update mutations. `DELETE` for deletes. Never PUT/PATCH.
- **Security**: Every endpoint needs `securityAccess` config.
- **Side effects**: Separated into `*-side-effects.ts` files, called explicitly after mutations.
- **Multi-server**: Use `distributedLock`, BullMQ deduplication, or `FOR UPDATE SKIP LOCKED` for concurrent operations.
- **Managed PostgreSQL**: No custom extensions. Use `sanitizeObjectForPostgresql()` for external data.
- **Before modifying a module**: Read its `FEATURE.md` file for entities, services, and integration details.

## Coding Conventions

- **No `any`** — use `unknown` with type guards
- **No `as SomeType`** — no type casting
- **No deprecated APIs** — prefer `z.enum` over `z.nativeEnum`
- **Go-style errors** — `tryCatch()` / `tryCatchSync()` from `@activepieces/shared`
- **Zod errors = i18n keys** — use `formErrors` from shared or keys from `translation.json`
- **Shared version bump** — any change to `packages/shared` needs patch (fix) or minor (new export) bump
- **File order**: Imports → Exports → Helpers → Types at END
- **Comments**: only *why*, never *what*

## Key Utilities (`@activepieces/shared`)

`apId()`, `tryCatch()`, `tryCatchSync()`, `isNil()`, `spreadIfDefined()`, `spreadIfNotUndefined()`, `ActivepiecesError({ code, params })`, `SeekPage<T>`, `formErrors`, `BaseModelSchema`, `chunk()`, `partition()`, `unique()`, `omit()`, `sanitizeObjectForPostgresql()`

## Testing

```bash
npm run test-unit     # Vitest: engine + shared
npm run test-api      # API integration (CE, EE, Cloud)
```
API tests: `setupTestEnvironment()` + `createTestContext(app)` → `ctx.post()`, `ctx.get()`. DB auto-cleaned between tests.

## Commands

```bash
npm start             # Setup dev + start all
npm run dev           # Frontend + backend
npm run lint-dev      # Lint with auto-fix (ALWAYS before done)
```

## Git Push

```bash
CLAUDE_PUSH=yes git push -u origin HEAD
```

## Database Migrations

Always read the [playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration) first.

## Keeping Docs Current

Before implementing, verify patterns against real code. If docs conflict with code, **trust the code**.
