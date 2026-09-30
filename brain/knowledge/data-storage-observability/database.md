---
icon: 🗄️
---

# Database

The one page before touching the DB. Covers isolation, entities, migrations, queries, and constraints.

## Multi-tenant isolation

Every query MUST filter by `projectId` or `platformId`. No exceptions.

- For connections with multi-project access, use `ArrayContains([projectId])` on the `projectIds` array column.
- New endpoints that read/write scoped data get a `securityAccess.project(..., permission)` config — passing `undefined` skips RBAC.

## Entities

Registering a new entity is a two-step chore. TypeORM does NOT auto-discover.

1. Add the class to `getEntities()` in `packages/server/api/src/app/database/database-connection.ts`.
2. Create a migration (see below) and register it in `getMigrations()` in `postgres-connection.ts`.

Missing step 1 causes silent runtime failures — the entity works locally with schema sync on, then breaks in prod.

Array columns:

```ts
columnName: {
    type: String,
    array: true,
    nullable: false,
}
```

Base columns: import `BaseModelSchema` for `id` / `createdAt` / `updatedAt`.

## Repositories

Use `repoFactory(Entity)()` from `@activepieces/shared`. Do not call `dataSource.getRepository()` directly.

## Queries

- **No N+1.** JOINs / `IN (:...ids)` / batch loads, never per-item lookups inside `Promise.all` or `.map()`.
- **Cache-shape changes bump the key version.** Anything through `distributedStore` is read by both old and new code during a rolling deploy. New fields arrive `undefined` and pass `Nullable()` validation silently. So `platform_plan:overview:v1:${platformId}` → `:v2:` whenever the shape changes. Old entries need no cleanup **if** the write set `ttlInSeconds`; unset TTLs orphan.

## Migrations — two tracks

Migrations live in two folders. The folder is the source of truth for how the migration runs.

| Track | Folder | Runs | History table | Rollback |
|---|---|---|---|---|
| **Blocking** | `packages/server/api/src/app/database/migration/postgres/` | boot lock | `migrations` (TypeORM default) | yes, `breaking` flag |
| **Background** | `packages/server/api/src/app/database/migration/postgres/background/` | post-listen via BullMQ | `background_migrations` | forward-only |

Tracks are **independent**. Neither waits for the other. Ordering is by timestamp filename within each track only.

### Choosing a track

- **Blocking** — schema shape fast enough to sit at boot: `ADD COLUMN nullable`, `CREATE TABLE`, `NOT VALID` constraints, `ADD CONSTRAINT ... USING INDEX`, `SET NOT NULL` (with a validated CHECK), fast additive DDL.
- **Background** — anything you don't want at boot: chunked backfills, index reshapes (`CREATE INDEX CONCURRENTLY` + `DROP INDEX CONCURRENTLY` sequences), `VALIDATE CONSTRAINT` on big tables.

Blocking runs under a Redis lock at boot — anything more than seconds blocks every replica from serving. If in doubt, background is the safe default.

**CIC is not automatically background.** The codebase has plenty of `CREATE INDEX CONCURRENTLY` in the blocking track using an inline `const concurrently = isPGlite() ? '' : 'CONCURRENTLY'` pattern (see e.g. `1857000000000-AddWaitpointDeadLetteredAt`). That's fine for a single index on a table where the boot delay is tolerable. Background makes sense when CIC + drops are stacked into a reshape, or the table is huge enough that the boot delay hurts deploys.

### Cross-track dependency

Contract-phase blocking DDL that depends on a background predecessor:

- **Postgres-safe** (`SET NOT NULL` on nulls, `USING INDEX` on missing index, `VALIDATE CONSTRAINT` on orphans, `ADD FOREIGN KEY` on orphans) — Postgres raises. No guard needed.
- **Silently dangerous** (`DROP COLUMN`, `DELETE FROM`) — call `migrationHelpers.assertBackgroundMigrationComplete({ queryRunner, migration: TheBackfill })` at the top of `up()`. Boot fails with a clear message if the backfill hasn't run.

Contract DDL and its backfill ship in **different releases**. Same-release attempts fail boot because the backfill hasn't run yet.

### Interfaces

Blocking:
```ts
export class MyMigration1857000000000 implements Migration {
    name = 'MyMigration1857000000000'
    breaking = false
    release = '0.91.0'
    // transaction defaults to true
    public async up(q: QueryRunner): Promise<void> { ... }
    public async down(q: QueryRunner): Promise<void> { ... }
}
```

Background:
```ts
export class BackfillFooStatus1858000000000 implements BackgroundMigration {
    name = 'BackfillFooStatus1858000000000'
    release = '0.91.0'
    transaction = false as const
    public async up(q: QueryRunner): Promise<void> { ... }
    public async down(): Promise<void> {}
}
```

`transaction = false as const` — the type is a `false` literal, so `tsc` catches a stray `true`. `CIC` and `VALIDATE CONSTRAINT` refuse to run in a transaction.

### CIC — helper or inline

Two accepted forms depending on the situation:

- **`migrationHelpers.createIndexConcurrently({ ... })`** — retry-safe. Checks `pg_index.indisvalid`: missing → CREATE, invalid (crashed CIC) → REINDEX, valid → no-op. A crashed CIC leaves an `INVALID` index behind, which a plain `IF NOT EXISTS` retry silently skips forever — the helper cleans that up. Use in any migration where a mid-flight failure is plausible (long-running CIC on a large table, background migrations that may be retried).

- **Inline `const concurrently = isPGlite() ? '' : 'CONCURRENTLY'`** — the established codebase pattern (`1857`, `1858`, `1839`, `1821`, and many others). Fine for a quick, well-scoped CIC in the blocking track where INVALID-retry recovery isn't a real concern. `IF NOT EXISTS` covers the common re-run.

Never write raw `CREATE INDEX CONCURRENTLY` without one of these — pglite falls over on it, and no retry story means an `INVALID` leftover sits forever.

### Index reshapes

Adding a new set of indexes and dropping the olds they replace goes in the **background track** whenever the table is large enough that the boot cost would hurt deploys. The whole reshape sits in one background migration with `transaction = false`, sequencing `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` so the table always has coverage.

Two orderings, author picks based on the size/risk trade:

**Pair-by-pair** — cheapest disk. Peak footprint is N indexes.

```ts
public async up(q: QueryRunner): Promise<void> {
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_1', ... })
    await q.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_old_1"`)
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_2', ... })
    await q.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_old_2"`)
}
```

**All creates then all drops** — safest rollback story. Peak footprint is 2N. If any CIC fails mid-batch, zero olds have been dropped yet.

```ts
public async up(q: QueryRunner): Promise<void> {
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_1', ... })
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_2', ... })
    await q.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_old_1"`)
    await q.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_old_2"`)
}
```

PR #14888 (`AddBarrierChildAttribution1858000000000`) uses the all-creates-first shape in the blocking track — that pattern works too, just with the boot-delay tradeoff. Same shape in background gives you zero-downtime deploy.

### Chunking backfills

```ts
public async up(q: QueryRunner): Promise<void> {
    while (true) {
        const res = await q.query(`
            UPDATE flow_version
               SET status = jsonb_build_object('kind', state)
             WHERE id IN (
                SELECT id FROM flow_version
                 WHERE status IS NULL
                 LIMIT 1000
             )
        `)
        if (res.rowCount === 0) break
    }
}
```

Commits per chunk, resumable on re-run (the `WHERE` skips done rows), no long transaction.

### Constraint recipes

**Unique:**
```sql
-- background
CREATE UNIQUE INDEX CONCURRENTLY idx_foo_unique ON foo (col);
-- blocking, next release
ALTER TABLE foo ADD CONSTRAINT foo_col_unique UNIQUE USING INDEX idx_foo_unique;
```

**Foreign key:**
```sql
-- blocking
ALTER TABLE foo ADD CONSTRAINT fk_foo FOREIGN KEY (bar_id) REFERENCES bar(id) NOT VALID;
-- background
ALTER TABLE foo VALIDATE CONSTRAINT fk_foo;
```

**CHECK:** same `NOT VALID` → `VALIDATE` pattern as FK.

**`NOT NULL` on existing column** (PG 12+):
```sql
-- blocking
ALTER TABLE foo ADD CONSTRAINT foo_col_not_null CHECK (col IS NOT NULL) NOT VALID;
-- background: backfill nulls first (see chunking above)
-- background
ALTER TABLE foo VALIDATE CONSTRAINT foo_col_not_null;
-- blocking, next release: PG 12+ skips the scan because the CHECK is VALID
ALTER TABLE foo ALTER COLUMN col SET NOT NULL;
ALTER TABLE foo DROP CONSTRAINT foo_col_not_null;
```

### Rollback

- Blocking migrations: `down()` required unless `breaking = true`. `check-migration-rollback.ts` enforces the `breaking` flag on destructive DDL.
- Background migrations: forward-only. `down()` is a no-op body; the rollback tooling skips the `background/` folder entirely. To undo a bad backfill, ship a forward-fix migration.

## Gotchas

- **pglite doesn't support `CONCURRENTLY`.** The CIC helper (and the inline `concurrently` ternary) falls back to plain `CREATE INDEX` when pglite is the backend. Only affects local dev.
- **`breaking = true` is the ROLLBACK-safety flag, not the customer-facing "breaking change" label.** Two different concepts. The label is decided per the [PR labels rules](../../../CLAUDE.md#pull-requests); the flag is decided per what the migration's `down()` can undo.
- **Contract DDL in the same release as its backfill fails boot** because the backfill hasn't run yet — its row isn't in `background_migrations`. Ship contract in the next release.
- **A brand-new hot-path index in the same release as the code that needs it can leave the app on seq scans while background CIC builds.** Only applies when there's *no* prior covering index for the query. Fixes: (a) ship the CIC in a prior release so it's built by the time the code lands (verify via `pendingCount` on `/v1/health/system`), or (b) put the CIC in the blocking track so the index is present when the app starts serving. Reshapes (replacing existing indexes) don't hit this — the old index keeps queries fast while new one builds.
- **Same-name migration in both folders would run twice.** The two history tables are independent — a rename or folder move without a seed-row migration double-executes on customers that already ran it in the old track.
- **Background migrations run on API pods only.** Workers don't register system-job handlers. Deployments with zero API pods will never finish backfills; not a supported topology, worth flagging if it comes up.

## Key files

- `packages/server/api/src/app/database/` — connection, migrations, helpers.
- `packages/server/api/src/app/database/postgres-connection.ts` — `getMigrations()`, `getBackgroundMigrations()`.
- `packages/server/api/src/app/database/migration.ts` — the `Migration` interface.
- `packages/server/api/src/app/database/background-migration.ts` — the `BackgroundMigration` interface.
- `packages/server/api/src/app/database/migration-helpers.ts` — `assertBackgroundMigrationComplete`, `createIndexConcurrently`.
- `packages/server/api/src/app/database/background-migration-runner.ts` — the BullMQ handler.
- `tools/scripts/check-migration-rollback.ts` — the CI check.

## Related pages

- [Tables](tables.md), [File Storage](file-storage.md), [Key-Value Store](key-value-store.md), [Audit Logs](audit-logs.md) — domain-specific storage.
- External: [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration) — general TypeORM mechanics.
