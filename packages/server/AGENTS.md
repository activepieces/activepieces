# Server Backend

You are working in the Activepieces server API (`packages/server/api`), engine (`packages/server/engine`), and worker (`packages/server/worker`).

## Tech Stack

- **Framework**: Fastify 5 with `fastify-type-provider-zod`
- **ORM**: TypeORM with PostgreSQL (EntitySchema pattern, NOT decorators)
- **Job Queues**: BullMQ (Redis-backed)
- **Cache/Redis**: ioredis with distributed locking
- **Observability**: OpenTelemetry, Pino logging
- **Language**: TypeScript (strict)

## Project Structure

- `src/app/` — Feature modules (flows, pieces, tables, webhooks, mcp, ai, etc.)
- `src/app/ee/` — Enterprise features (SSO, SAML, SCIM, billing, audit, embed, etc.)
- `src/app/database/` — Migrations, connection setup, redis connections
- `src/app/core/` — Security (authn/authz middleware), db repo factory, websockets
- `src/app/helper/` — Pagination, system props, system jobs, error handler, openapi

## Entity Pattern

Use `EntitySchema` (NOT decorators). Register in `getEntities()` in `database-connection.ts`:

```typescript
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type MyFeatureSchema = MyFeature & { project: Project }

export const MyFeatureEntity = new EntitySchema<MyFeatureSchema>({
    name: 'my_feature',
    columns: {
        ...BaseColumnSchemaPart,  // id (PK, 21 chars), created, updated
        name: { type: String, nullable: false },
        projectId: { ...ApIdSchema, nullable: false },
    },
    indices: [
        { name: 'idx_my_feature_project_id', columns: ['projectId'] },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: { name: 'projectId', foreignKeyConstraintName: 'fk_my_feature_project_id' },
        },
    },
})
```

Column patterns: `ApIdSchema` = `{ type: String, length: 21 }`. Array columns: `{ type: String, array: true, nullable: false }`. Soft delete: `{ type: 'timestamp with time zone', deleteDate: true, nullable: true }`.

## Service Pattern

**Two variants** — choose based on whether you need logging:

```typescript
// DOMINANT (59 files): Function factory — use when logging, telemetry, or distributed locking needed
export const myService = (log: FastifyBaseLogger) => ({
    async create({ projectId, request }: CreateParams): Promise<MyFeature> {
        return myFeatureRepo().save({ id: apId(), projectId, ...request })
    },
})
// Called as: myService(request.log).create(...)

// SIMPLER (21 files): Plain object — use for pure CRUD with no logging
export const myService = {
    async create({ projectId, request }: CreateParams): Promise<MyFeature> {
        return myFeatureRepo().save({ id: apId(), projectId, ...request })
    },
}
// Called as: myService.create(...)
```

## Controller Pattern

`FastifyPluginAsyncZod`. Route config objects defined AFTER the controller function:

```typescript
export const myController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post('/', CreateRequest, async (request) => {
        return myService(request.log).create({
            projectId: request.projectId,
            request: request.body,
        })
    })
}

const CreateRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE],
            Permission.WRITE_MY_FEATURE,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['my-feature'],
        body: CreateMyFeatureRequest,
        response: { [StatusCodes.CREATED]: MyFeature },
    },
}
```

## Security Access

Every endpoint MUST have `config.security`. `request.projectId` is set by authorization middleware.

- `securityAccess.project(principals, permission, { type: ProjectResourceType.X })` — project-scoped
- `securityAccess.platformAdminOnly(principals)` — platform admin only
- `securityAccess.publicPlatform(principals)` — any authenticated platform member
- `securityAccess.public()` — no auth required
- `securityAccess.unscoped(principals)` — worker/internal
- `securityAccess.engine()` — engine principal only

`ProjectResourceType`: `BODY` (from body), `QUERY` (from querystring), `PARAM` (from URL), `TABLE` (look up entity in DB).

## Module Registration

```typescript
// my-feature.module.ts
export const myFeatureModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(myController, { prefix: '/v1/my-features' })
}

// app.ts — register in CE or EE section based on edition
await app.register(myFeatureModule)
```

## Migration Workflow

1. Read [playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration)
2. Create class: `{Timestamp}{PascalCaseDescription}` (e.g., `AddMyFeature1774500000000`)
3. Implement `MigrationInterface` with `up()` and `down()`
4. Import in `postgres-connection.ts` and add to `getMigrations()` array (chronological order)
5. PGlite check: `const isPGlite = databaseType === DatabaseType.PGLITE`
6. Use `CREATE INDEX CONCURRENTLY` for Postgres only (not PGlite). Set `transaction = false` when using CONCURRENTLY.

## Edition & Feature Gating

- CE code: `src/app/`. EE code: `src/app/ee/`. **Never import EE in CE code.**
- Gate EE module: `app.addHook('preHandler', platformMustHaveFeatureEnabled((p) => p.plan.myFlag))`
- Hooks pattern: `hooksFactory.create<MyHooks>(defaultImpl)` in CE, `.set(eeImpl)` in `app.ts` edition switch
- Quota: `platformPlanService(log).checkActiveFlowsExceededLimit(platformId, metric)`

## Execution Engine (`packages/server/engine`)

- **4 executors**: `pieceExecutor`, `codeExecutor`, `loopExecutor`, `routerExecutor`
- **Main loop**: `flowExecutor.execute()` chains steps via `nextAction` linked list
- **Piece context**: `auth`, `store`, `files`, `connections`, `run` hooks (stop/pause/respond), `agent` tools, `server` API
- **Code steps**: Compiled JS loaded from disk, run in V8 isolate (128MB memory limit)
- **Loops**: Iterate items array, create nested execution paths per iteration (`StepExecutionPath`)
- **Router**: AND/OR condition groups. `EXECUTE_FIRST_MATCH` or `EXECUTE_ALL_MATCH` modes.
- **Variable resolution**: `{{step.output}}` → `propsResolver.resolve()` → V8 eval. Single token preserves type.
- **Retries**: `runWithExponentialBackoff()` — 4 attempts, 2^n × 2000ms. Per-step `retryOnFailure` option.
- **Error handling**: `continueOnFailure` resets verdict to RUNNING. Failed step recorded in verdict.
- **State**: Immutable `FlowExecutorContext` — steps, verdict, currentPath, duration, tags

## Worker & Sandbox (`packages/server/worker`)

- **Job types**: `EXECUTE_FLOW`, `EXECUTE_WEBHOOK`, `EXECUTE_POLLING`, `RENEW_WEBHOOK`, `EXECUTE_TRIGGER_HOOK`, `EXECUTE_PROPERTY`, `EXECUTE_VALIDATION`, `EXTRACT_PIECE_INFORMATION`, `EVENT_DESTINATION`
- **Piece provisioning**: Cache lookup → download from API → npm install → load into sandbox
- **Sandbox modes**: `UNSANDBOXED`, `SANDBOX_PROCESS`, `SANDBOX_CODE_ONLY`, `SANDBOX_CODE_AND_PROCESS`
- **Flow timeout**: `FLOW_TIMEOUT_SECONDS` → `SANDBOX_EXECUTION_TIMEOUT` error → `FlowRunStatus.TIMEOUT`
- **State backup**: Every 15s, zstd-compressed, uploaded to S3. Enables crash recovery.

## Pause & Resume

- **Short delay** (<10s): `setTimeout` in-process
- **Long delay** (>10s): `PauseType.DELAY` → BullMQ delayed job for resume
- **Webhook pause**: `PauseType.WEBHOOK` → waits for callback at `/v1/flow-runs/{id}/requests/{requestId}`
- **Resume**: Fetches state from logs, rebuilds `FlowExecutorContext`, re-runs from paused step with `ExecutionType.RESUME`
- **Startup**: `refill-paused-jobs` re-queues all paused runs with correct delays

## Error Handling

`ActivepiecesError({ code: ErrorCode.X, params })`. Key mappings: `ENTITY_NOT_FOUND` → 404, `QUOTA_EXCEEDED` / `FEATURE_DISABLED` → 402, `PERMISSION_DENIED` → 403, `VALIDATION` → 409. Default: 400.

## Pagination

```typescript
const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
const paginator = buildPaginator({ entity: MyEntity, query: { limit, order: 'DESC', afterCursor: decodedCursor.nextCursor } })
const result = await paginator.paginate(queryBuilder)
return paginationHelper.createPage(result.data, result.cursor)
```

## Infrastructure

- `repoFactory(Entity)` — returns getter `repo()`, or `repo(entityManager)` for transactions
- `buildPaginator()` + `paginationHelper.decodeCursor/createPage` — cursor-based pagination
- `distributedLock(log).runExclusive({ key, timeoutInSeconds, fn })` — Redis distributed locking
- `transaction(async (em) => { ... })` — DB transactions with EntityManager
- `websocketService.to(projectId).emit(event, data)` — real-time updates
- `pubsub.publish/subscribe` — cross-instance cache invalidation
- Side effects: separate `*-side-effects.ts` files, called explicitly after mutations
- System jobs: `SystemJobName` enum, `systemJobHandlers.registerJobHandler()` in `app.ts`

## Testing

```typescript
// packages/server/api/test/integration/ce/my-feature.test.ts
let app: FastifyInstance
beforeAll(async () => { app = await setupTestEnvironment() })

it('should create a resource', async () => {
    const ctx = await createTestContext(app)
    const res = await ctx.post('/v1/my-features', { name: 'test', projectId: ctx.project.id })
    expect(res.statusCode).toBe(200)
})
```

DB auto-cleaned between tests (TRUNCATE CASCADE + seeds). Run with `npm run test-api`.
