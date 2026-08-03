---
icon: 🧱
---

# Server Module Anatomy

What a server module looks like in `packages/server/api/src/app/`. The canonical reference is the `tables/` module — when this page and that module disagree, the module wins.

A module is six files in one folder: entity, migration, repository, service, controller, module registration. Build them in that order; each depends on the one before.

## Shared types first

Zod schemas + `z.infer` types go in `packages/core/shared/src/lib/{domain}/`, exported from the `src/index.ts` barrel. **Bump `packages/core/shared/package.json`** — patch for a fix, minor for a new export. Check whether the branch already bumped it.

## Entity

`EntitySchema`, never decorators. See `tables/table/table.entity.ts`.

- `...BaseColumnSchemaPart` for `id` / `created` / `updated`
- `ApIdSchema` for foreign keys — `{ ...ApIdSchema, nullable: false }`
- `projectId` column + relation to project, `CASCADE` delete
- `foreignKeyConstraintName` on every join column
- Array columns: `{ type: String, array: true, nullable: false }`

Then **register it in `getEntities()`** in `database/database-connection.ts`. TypeORM does not auto-discover; skipping this fails silently at runtime.

## Migration

Update the entity *first* — the generator diffs entity state against the database. Then from `packages/server/api/`:

```bash
npm run db-migration -- src/app/database/migration/postgres/MigrationName
```

Patch the generated file — the CLI emits TypeORM's `MigrationInterface`, which this repo does not use:

```ts
import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMyColumn1234567890 implements Migration {
    name = 'AddMyColumn1234567890'
    breaking = false
    release = '0.78.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD COLUMN "description" text`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "description"`)
    }
}
```

`breaking`, `release`, and a `down()` that actually reverses `up()` are all mandatory — CI rejects the migration without them. `release` is the upcoming version from the root `package.json`. Register the class at the end of `getMigrations()` in `database/postgres-connection.ts`, chronologically.

Full procedure: the [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration).

## Repository

`const myRepo = repoFactory(MyEntity)` — called as `myRepo()`, or `myRepo(entityManager)` inside a transaction.

## Service

Factory `(log: FastifyBaseLogger) => ({ ... })` when it logs, a plain object otherwise. See `tables/table/table.service.ts`. Mutations that fire events or webhooks put those in a separate `*-side-effects.ts` and call it explicitly after the mutation.

## Controller

`FastifyPluginAsyncZod`. Route configs are declared **after** the controller, not inline:

```ts
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

`POST` for every create and update, `DELETE` for deletes — never `PUT`/`PATCH`. Every route needs a `securityAccess`:

| Helper | Scope |
|---|---|
| `securityAccess.project(principals, permission, { type })` | project-scoped, RBAC-checked |
| `securityAccess.platformAdminOnly(principals)` | platform admins |
| `securityAccess.publicPlatform(principals)` | any platform member |
| `securityAccess.public()` | no auth |

A new capability needs a new value in the `Permission` enum in `@activepieces/shared`.

## Module registration

```ts
export const myModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(myController, { prefix: '/v1/my-features' })
}
```

Register in `app.ts`, in the CE or EE section. EE-only modules live under `src/app/ee/` and gate with `platformMustHaveFeatureEnabled((p) => p.plan.myFlag)`. To extend CE behaviour from EE, use `hooksFactory.create<T>(ceDefault)` in CE and `.set(eeImpl)` in the `app.ts` edition switch — **never import `src/app/ee/` from CE code**.

Queued work: add to `SystemJobName` or `WorkerJobType` in shared, register the handler via `systemJobHandlers.registerJobHandler()` in `app.ts`.

## Tests

`packages/server/api/test/integration/ce/{feature}.test.ts`, using `setupTestEnvironment()` + `createTestContext(app)` → `ctx.post()` / `ctx.get()`. The DB is cleaned between tests.

Verify with `npm run lint-dev` and `npm run test-api`.

## Gotchas

- **`getEntities()` and `getMigrations()` are both manual.** Nothing is auto-discovered. A missing entity registration fails silently at runtime; a missing migration registration means the migration simply never runs.
- **The migration generator emits the wrong interface.** Every generated file must be patched from `MigrationInterface` to this repo's `Migration`, or CI rejects it. Never hand-write the SQL instead — generate from the entity diff, then patch.
- **PGlite has one connection, so `CONCURRENTLY` breaks it.** Guard on `system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE` and issue a plain `CREATE INDEX` on that branch. When you do use `CONCURRENTLY`, set `transaction = false` on the migration class — PostgreSQL requires it outside a transaction.
- **`breaking = true` is the rollback-safety flag, not the customer-facing one.** It marks destructive DDL (`DROP TABLE`/`DROP COLUMN`, `ADD ... NOT NULL` without a default) for `rollback-migrations.ts`. It does *not* by itself mean the PR needs the `⛓️‍💥 breaking-change` label — decide that from upgrade impact on self-hosters and API consumers.
- **`permission: undefined` on `securityAccess.project(...)` silently allows any project member.** The argument is required in practice even though the type tolerates omitting it.
- **Every query filters by `projectId` or `platformId`.** For connections with multi-project access, use `ArrayContains([projectId])` on the `projectIds` array column.
