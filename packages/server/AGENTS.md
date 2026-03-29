# Server Backend

Fastify 5 + TypeORM (PostgreSQL) + BullMQ (Redis) + `fastify-type-provider-zod`.

## Patterns (Reference Real Code)

- **Entity**: `EntitySchema` + `BaseColumnSchemaPart` + `ApIdSchema`. Register in `getEntities()`. See `tables/table/table.entity.ts`.
- **Service (dominant)**: `export const myService = (log: FastifyBaseLogger) => ({...})` — use when logging, telemetry, or locking needed. See `flows/flow/flow.service.ts`.
- **Service (simple)**: `export const myService = {...}` — use for pure CRUD. See `tables/table/table.service.ts`.
- **Controller**: `FastifyPluginAsyncZod`. Route config objects AFTER controller. See `tables/table/table.controller.ts`.
- **Module**: Register in `app.ts`. See `tables/tables.module.ts`.

## Security Access (6 variants)

- `securityAccess.project(principals, permission, { type: ProjectResourceType.X })` — project-scoped
- `securityAccess.platformAdminOnly(principals)` — platform admin
- `securityAccess.publicPlatform(principals)` — any platform member
- `securityAccess.public()` — no auth
- `securityAccess.unscoped(principals)` — worker/internal
- `securityAccess.engine()` — engine only

`ProjectResourceType`: `BODY`, `QUERY`, `PARAM`, `TABLE`. Populates `request.projectId` via middleware.

## Migrations

1. Read [playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration)
2. Create class implementing `MigrationInterface` with `up()` and `down()`
3. Import in `postgres-connection.ts` → add to `getMigrations()` (chronological)
4. PGlite: use `CREATE INDEX` (not `CONCURRENTLY`). Set `transaction = false` for `CONCURRENTLY`.

## Edition Gating

- CE: `src/app/`. EE: `src/app/ee/`. Never cross-import.
- Gate EE: `app.addHook('preHandler', platformMustHaveFeatureEnabled((p) => p.plan.myFlag))`
- Hooks pattern: `hooksFactory.create<T>(ceDefault)` in CE, `.set(eeImpl)` in `app.ts`
- Quota: `platformPlanService(log).checkActiveFlowsExceededLimit()`

## Infrastructure

- `repoFactory(Entity)` → `repo()` or `repo(entityManager)` for transactions
- `buildPaginator({ entity, query })` + `paginationHelper.decodeCursor/createPage`
- `distributedLock(log).runExclusive({ key, timeoutInSeconds, fn })`
- `transaction(async (em) => {...})`
- `websocketService.to(projectId).emit(event, data)`
- `entitiesMustBeOwnedByCurrentProject` preSerialization hook for project-scoped responses

## Testing

See `test/integration/ce/` for patterns. Use `setupTestEnvironment()` + `createTestContext(app)` → `ctx.post()`, `ctx.get()`. DB auto-cleaned. Run: `npm run test-api`.
