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

**Retiring a `SystemJobName` is two steps, and doing only the first orphans jobs forever.** Deleting the enum member removes it from `knownJobNames`, but `isDeprecated()` in `system-job.ts` is `!knownJobNames.includes(name) && deprecatedJobs.some(d => name.startsWith(d))` — so a name that is unknown *and* unlisted matches neither branch and is never swept. Whatever is already queued in Redis then survives every `init()`, and `getJobHandler` throws `No handler for job <name>` on each scan, forever. So also **add the string literal to the `deprecatedJobs` array** in the same file; the 14 names already there are the precedent. Seed one in `test/unit/app/helper/system-jobs/remove-deprecated-jobs.test.ts` — its assertions compare the whole remaining queue, so a seeded job is covered for free.

## Tests

`packages/server/api/test/integration/ce/{feature}.test.ts`, using `setupTestEnvironment()` + `createTestContext(app)` → `ctx.post()` / `ctx.get()`. The DB is cleaned between tests.

Verify with `npm run lint-dev` and `npm run test-api`.

**`packages/server/api/test/unit/**` runs in no pipeline — do not trust it as a safety net.** The package defines a `test-unit` script, but CI only runs `turbo run test-ce test-ee test-cloud check-migrations --filter=api` (`ci.yml`), and the root `npm run test-unit` filters to `engine`/`shared`/`sandbox`/`core-utils`/`server-utils`/`pieces-framework`/`web`/`ee-embed-sdk` — `api` is not in that list. So those specs are only ever run by hand, and they rot: measured Aug 2026 on a clean `main`, **18 tests across 4 files already failed** (`workers/job-queue/job-broker`, `workers/machine/machine-service`, `core/canary/worker-group.service`, `knowledge-base/file-service-delete`). Two consequences: put a server test you actually want enforced under `test/integration/ce`, and when a local `test/unit` run goes red, check `main` before assuming your branch caused it.

## Gotchas
- **`z.record()` over an enum key is exhaustive in zod v4 — a sparse map needs `z.partialRecord()`.** `z.record(z.enum(SomeEnum), value)` demands *every* member of the enum and fails with `expected record, received undefined` for each missing key, which is the opposite of the `Partial<Record<Enum, T>>` shape this codebase uses everywhere (provider maps, capability tables, per-edition config). It bit the AI model catalog: the schema wanted all 16 `AIProviderName` members while the real payload carries 13, so validation added to protect production would instead have rejected it on the first fetch. The unit-test fixture passed either way, because fixtures are written to match the schema. **Validate a schema against the real generated artefact, not only against a fixture** — that is the only step that catches this class of bug.
- **The API needs Node 22.15+ and dies at import time on Node 20, with an error that names neither Node nor a version.** `app/file/file-compressor.ts` calls `promisify(zlib.zstdDecompress)` at module load, and zstd only reached Node's `zlib` in 22.15. On Node 20 that argument is `undefined`, so the process exits with `TypeError [ERR_INVALID_ARG_TYPE]: The "original" argument must be of type function` before a single line of server code runs, and the stack points at `file-compressor.ts` rather than at your change. `nvm use 24` is the fix. Worth knowing because the repo does not pin this anywhere the shell will notice, so an inherited Node 20 shell reads as "my branch broke the server".
- **A fresh `bun install --ignore-scripts` cannot boot the API, even on Postgres.** `--ignore-scripts` is the usual way past `isolated-vm` failing to compile on macOS, but it also skips every other native build, and the server crashes on a missing `node_sqlite3.node`: the sqlite driver is imported eagerly regardless of `AP_DB_TYPE`. Copying the prebuilt `.node` files across from a working checkout is enough (47 of them, under `node_modules/.bun/**`), provided both checkouts run the same Node major, since the binding is ABI-locked.

- **Add a field to a shared response schema and the running dev API will silently strip it until you rebuild `packages/core/shared`.** The API resolves `@activepieces/shared` through node_modules to `main: ./dist/src/index.js`, while the web app resolves the same specifier through the tsconfig path to `src/` — so a new key on, say, `projectAnalytics` type-checks in the browser code and is absent from the actual payload, because Fastify serialises the response against the *stale dist* zod schema and drops what that schema does not declare. `tsx watch` does not save you: the api `serve` script watches `packages/core/shared/src/**` and restarts, but the restarted process still imports `dist`. Run `npx turbo run build --filter=@activepieces/shared` after editing shared, then verify the field is really on the wire (`curl` the endpoint) rather than trusting the types. The failure looks like a frontend bug — the field reads `undefined` with nothing logged anywhere.
- **`getEntities()` and `getMigrations()` are both manual.** Nothing is auto-discovered. A missing entity registration fails silently at runtime; a missing migration registration means the migration simply never runs.
- **The migration generator emits the wrong interface.** Every generated file must be patched from `MigrationInterface` to this repo's `Migration`, or CI rejects it. Never hand-write the SQL instead — generate from the entity diff, then patch.
  - **Exception: the generator diffs against *your* database, so a surviving table of the same name produces an `ALTER`, not a `CREATE`.** Adding `AgentEntity` (table `agent`) emitted a mutation of the dead 2025 `agent` table — `DROP COLUMN systemPrompt`, then `ADD "iconKey" character varying NOT NULL` with no default, which fails on any table that has rows — and left `agent_run` untouched. When you are deliberately replacing an orphaned table, hand-write `DROP TABLE IF EXISTS … CASCADE` + `CREATE TABLE`, and check `pg_constraint` for FKs pointing at it first.
- **`npm run check-migrations` can pass while your database is untouched.** It sources `.env.tests` (not `.env.dev`) and pipes `migration:run` to `/dev/null`, so it reported "No changes in database schema were found" against a database still holding the pre-migration table. Treat a green run as "the entity and *some* database agree", not as proof your migration executed. To actually verify, run `migration:run` against the dev DB with an explicit `AP_POSTGRES_HOST` and then inspect `information_schema.columns`, `pg_indexes` and `pg_constraint`.
- **Migration timestamps collide across unmerged branches.** `migrations` is keyed by class name, so two branches can both claim `1824000000000` and only conflict at merge. Before picking a timestamp, check the applied ledger (`select name from migrations order by id desc limit 5`) as well as the files on `main` — a timestamp can already be in use by a branch you cannot see. When the collision does surface in a merge, renumber **yours** — the one on `main` is already applied in production and cannot move — which means renaming the file, the class, and the class's `name` field, then re-registering it after the merged one in `getMigrations()`. Whoever already ran the old name locally needs no DB surgery *provided* `up()` is idempotent (`IF NOT EXISTS` / `DROP … IF EXISTS` throughout): TypeORM sees an unapplied name and re-runs it as a no-op. Without that, they have to update the `migrations` ledger row by hand.
- **PGlite has one connection, so `CONCURRENTLY` breaks it.** Guard on `system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE` and issue a plain `CREATE INDEX` on that branch. When you do use `CONCURRENTLY`, set `transaction = false` on the migration class — PostgreSQL requires it outside a transaction.
- **`CREATE INDEX CONCURRENTLY IF NOT EXISTS` without a `DROP … IF EXISTS` prelude leaves an INVALID index forever.** A concurrent build that aborts (deadlock, cancelled statement, killed connection) leaves the index behind marked INVALID — maintained on every write, used by no query. TypeORM does not mark the migration complete, so it retries, but the leftover INVALID index *satisfies* `IF NOT EXISTS`, so the retry is a silent no-op and the index never becomes valid. Always lead a concurrent build with `DROP INDEX CONCURRENTLY IF EXISTS "<same name>"`, the way `1821000000000-AddWaitpointSignals` does.
- **In a `transaction = false` migration, `ALTER TABLE … ADD CONSTRAINT` is the one statement that cannot be made retry-safe by a guard.** PostgreSQL has no `IF NOT EXISTS` for it. Every other statement in such a migration takes `IF NOT EXISTS`/`IF EXISTS`, so the file reads as re-runnable — but with no transaction to roll back, a failure in any *later* statement leaves the constraint in place while TypeORM leaves the migration unrecorded. The retry on next boot dies on `duplicate_object`, and the instance boot-loops. Wrap it in `DO $$ … EXCEPTION WHEN duplicate_object THEN NULL; END $$` or pre-check `pg_constraint`, as `1821000000000-AddWaitpointSignals` does for `waitpoint_signal`'s FK to `waitpoint`.
- **Concurrency is a per-table decision, and the small table is the one people forget.** `CREATE INDEX` without `CONCURRENTLY` takes a SHARE lock that blocks every INSERT/UPDATE/DELETE on that table for the whole build. `flow_run` gets the concurrent treatment by reflex because it is huge; `waitpoint` gets missed because it is small — but every run that pauses, resumes or finishes writes to it, so blocking it stalls execution instance-wide. Size of the table is not the criterion; write traffic on the critical path is.
- **Duplicate migration timestamps are safe, not luck.** Several timestamps are shared by two or three files (1787, 1794, 1797, 1798, 1811, 1818, 1819, …). TypeORM sorts `getMigrations()` by parsed timestamp and `Array.prototype.sort` has been spec-stable since ES2019, so ties resolve to array order in `postgres-connection.ts` — the same code on every instance, hence the same order everywhere. Do not add a tie-break scheme. Do keep a real dependency (column → index on that column) on *distinct* timestamps rather than relying on array order to express it.
- **`EntitySchema` supports partial-index `where`, but not expression columns.** For a partial index on a bare column (e.g. `ON file(platformId) WHERE projectId IS NULL`), pass `where: '"projectId" IS NULL'` alongside `columns: ['platformId']` — TypeORM 0.3.x's `EntitySchemaIndexOptions.where` is honored by the Postgres driver (`PostgresQueryRunner` line 2442: `${where ? "WHERE " + where : ""}`), so `synchronize` can stay on and `migration:generate` tracks the index correctly. Reserve `synchronize: false` for **expression indexes** — `columns` is `string[]` of bare column names with no expression syntax, so an index like `ON file(type, (metadata->>'flowId'))` (see `idx_file_sample_data_flow_id`) genuinely can't be expressed and needs the opt-out. Blindly using `synchronize: false` for every hand-written index (which I did once and got called on) leaves TypeORM blind to the index — future `migration:generate` won't drop it if you remove it from the entity, and drift can silently accumulate.
- **`UpdateResult.affected` is `undefined` on PGlite — never branch on it.** TypeORM's Postgres driver sets `affected` from `raw.rowCount`, and `typeorm-pglite` returns PGlite's `Results` (`{ rows, fields, affectedRows }`) with no `rowCount`. So the compare-and-set idiom `if (result.affected === 0) return null` is *always false* on PGlite and every predicate in the `WHERE` becomes decorative — the guard silently passes. This is not test-only: `AP_DB_TYPE=PGLITE` is the documented one-line Docker install (`docs/install/options/docker.mdx`). It hit MCP OAuth (`mcpOAuthCodeService.consume`), where it made authorization codes replayable, unbound to their client and redirect_uri, and immune to expiry. Use `.returning('*')` and test `updateResult.raw` for emptiness instead — that works on both drivers. Confirmed against the pinned `@electric-sql/pglite` 0.3.14: a plain `UPDATE` answers `{ rows, fields, affectedRows }` with **`rowCount: undefined`**, while the same statement with `RETURNING *` fills `rows` correctly (0 on no match, 1 on match). Note PGlite *does* report `affectedRows` — it is only `rowCount`, the field TypeORM reads, that is missing, so "PGlite loses the count" is the wrong mental model. The remaining call sites were converted in 2026-08 (`ee/agent/agent-rpc-handlers.ts`, `ee/projects/platform-project-service.ts`); a `.affected` that only feeds a log line was left alone. **Integration tests here run on PGlite** (`.env.tests` sets `AP_DB_TYPE=PGLITE`), so they do exercise this class by default; it was still missed because nothing asserted on the guard. Earlier revisions of this page claimed the suite ran against a real Postgres server, which is wrong. Prefer `.returning('id')` over `.returning('*')`: on a table like `agent_conversation` the star form hauls the whole `messages` jsonb back on every write, and a row only has to be counted, not read.
- **No concurrency property can be tested in the api integration suite.** `.env.tests` runs PGlite, one in-process connection, so a second session cannot exist: `SELECT … FOR UPDATE` held from the test blocks nothing, two `Promise.all` requests serialise before either transaction opens, and a lost update is unobservable. A test written for a race there passes with the lock removed, which reads as proof and is the opposite. Measured Aug 2026 while adding a row lock to the agent draft-tools edit: deleting `setLock('pessimistic_write')` left all 13 tests green. So pin the user-visible invariant, mutation-test the parts that *are* observable (a name in a denylist, a guard's SQL), and say plainly in the commit that the lock rests on Postgres row semantics rather than a reproduced race. Row locks use `.createQueryBuilder().setLock('pessimistic_write')` inside `transaction(...)` — three of the four sites in the repo take that form.
- **`breaking = true` is the rollback-safety flag, not the customer-facing one.** It marks destructive DDL (`DROP TABLE`/`DROP COLUMN`, `ADD ... NOT NULL` without a default) for `rollback-migrations.ts`. It does *not* by itself mean the PR needs the `⛓️‍💥 breaking-change` label — decide that from upgrade impact on self-hosters and API consumers.
- **A new `AppSystemProp` needs three edits, not one.** Add the enum entry in `system-props.ts`, a default in `systemPropDefaultValues` (`system.ts`), *and* a validator in `systemPropValidators` (`system-validator.ts`). Miss the validator and `validateEnvPropsOnStartup` throws `systemPropValidators[prop] is not a function` at boot — every API test fails on setup, not just the new one. Document the var in `docs/install/reference/environment-variables.mdx` too.
- **`permission: undefined` on `securityAccess.project(...)` silently allows any project member.** The argument is required in practice even though the type tolerates omitting it.
- **Every query filters by `projectId` or `platformId`.** For connections with multi-project access, use `ArrayContains([projectId])` on the `projectIds` array column.
- **A mutation test against a `packages/core/*` package proves nothing until you rebuild its dist.** The api package resolves `@activepieces/core-utils` and friends through `node_modules` to `dist/`, not through the tsconfig path to `src/`, so breaking the source and re-running an api test reports a pass while the test is still executing the old build. Measured: removing the connection-template unwrap from `core-utils/src` left `agent-tool-pinning.test.ts` fully green, and the same mutation failed it once `turbo run build --filter=@activepieces/core-utils` had run. Web tests do not share the trap — vitest aliases the core packages to `src` in `packages/web/vitest.config.ts` — so a web suite catching a core mutation while the api suite ignores it is the signature of a stale dist rather than of missing coverage. Same cause as the phantom "has no exported member" errors after merging a branch that adds a core export.
