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

**CIC is not automatically background.** A single `CREATE INDEX CONCURRENTLY` on a table where the boot delay is tolerable belongs in the blocking track. Background makes sense when CIC + drops are stacked into a reshape, or the table is huge enough that the boot delay hurts deploys. Either way, always go through `migrationHelpers.createIndexConcurrently` — see below.

### Cross-track dependency

**Any blocking migration that depends on a background backfill MUST call `migrationHelpers.assertBackgroundMigrationComplete({ queryRunner, migration: TheBackfill })` as the first statement of `up()`.** No exceptions — not for `DROP COLUMN`, not for `SET NOT NULL`, not for `USING INDEX`, not for `VALIDATE CONSTRAINT`.

The guard is what triggers boot catchup. Catchup only reacts to the typed `BackgroundMigrationNotCompleteError` the guard throws; a raw Postgres error (nulls hitting `SET NOT NULL`, missing index hitting `USING INDEX`, orphans hitting `VALIDATE CONSTRAINT`) is NOT recognized as a cross-track failure — catchup rethrows it and boot wedges in a restart loop. The guard is the only way for the catchup to know which backfill to run.

The guard also prevents the silently dangerous cases (`DROP COLUMN`, `DELETE FROM`) that Postgres won't error on at all.

Contract DDL and its backfill ship in **different releases**. Same-release attempts fail boot, catchup runs the backfill, retries — this is the intended path.

**Release-notes convention:** when a release ships a background migration whose dependent contract DDL lands in a later release, that earlier release's notes must say something like "self-hosters should let backfill X complete before upgrading further; the app catches up at boot but it may take ~N minutes." Boot catchup handles skip-release correctly, but operators deserve the heads-up so they can plan the upgrade window.

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

### CIC — always via the helper

Every CIC goes through `migrationHelpers.createIndexConcurrently({ ... })`, and every `DROP INDEX CONCURRENTLY` goes through `migrationHelpers.dropIndexConcurrently({ ... })`. Both tracks, no exceptions.

The helper handles the two things a raw `CREATE INDEX CONCURRENTLY` gets wrong:

- **pglite fallback.** pglite rejects `CONCURRENTLY`; the helper runs a plain `CREATE INDEX IF NOT EXISTS` on pglite so local dev works.
- **Retry safety.** A crashed CIC leaves an `INVALID` index behind. A plain `IF NOT EXISTS` retry sees the name exists and skips — the `INVALID` entry sits forever, unused by the planner. The helper checks `pg_index.indisvalid` and runs `REINDEX INDEX CONCURRENTLY` on an invalid leftover, `CREATE` on a missing one, no-op on a valid one.

Older migrations in `postgres/` use an inline `const concurrently = isPGlite() ? '' : 'CONCURRENTLY'` ternary. Don't write new ones that way — the helper supersedes it. Treat the inline pattern as legacy.

### Index reshapes

Adding a new set of indexes and dropping the olds they replace goes in the **background track** whenever the table is large enough that the boot cost would hurt deploys. The whole reshape sits in one background migration with `transaction = false`, sequencing `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` so the table always has coverage.

Two orderings. **Default to All creates then all drops** — mid-batch failure leaves full coverage, recovery is "drop the half-built news and restart", and disk is almost always the cheaper resource than a hot table's coverage. Switch to pair-by-pair only when disk headroom genuinely can't take 2N.

**All creates then all drops** — the default. Peak footprint is 2N indexes. If any CIC fails mid-batch, zero olds have been dropped yet, so the table still has its original coverage — safest rollback story. Use when: the table is hot and you can't afford a transient coverage gap, more than ~3 index pairs are being swapped, or you have the disk for 2N indexes.

```ts
public async up(q: QueryRunner): Promise<void> {
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_1', ... })
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_2', ... })
    await migrationHelpers.dropIndexConcurrently({ queryRunner: q, name: 'idx_old_1' })
    await migrationHelpers.dropIndexConcurrently({ queryRunner: q, name: 'idx_old_2' })
}
```

**Pair-by-pair** — the disk-constrained variant. Peak footprint is N+1 indexes. Use when: the per-index footprint is big enough that 2N would strain disk, the reshape is only 1-2 pairs, or the pair semantics are independent (new1 fully replaces old1 before new2 is even started). Cost: if a later CIC fails, the earlier olds are already dropped — reduced coverage until the next retry succeeds.

```ts
public async up(q: QueryRunner): Promise<void> {
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_1', ... })
    await migrationHelpers.dropIndexConcurrently({ queryRunner: q, name: 'idx_old_1' })
    await migrationHelpers.createIndexConcurrently({ queryRunner: q, name: 'idx_new_2', ... })
    await migrationHelpers.dropIndexConcurrently({ queryRunner: q, name: 'idx_old_2' })
}
```

The All-creates-then-all-drops shape can also be done in the blocking track, with the boot-delay tradeoff. The background version gives zero-downtime deploy for the same work.

### Chunking backfills

```ts
public async up(q: QueryRunner): Promise<void> {
    while (true) {
        const rows = await q.query(`
            WITH updated AS (
                UPDATE flow_version
                   SET status = jsonb_build_object('kind', state)
                 WHERE id IN (
                     SELECT id FROM flow_version
                      WHERE status IS NULL
                      LIMIT 1000
                 )
                RETURNING 1
            )
            SELECT count(*)::int AS updated_count FROM updated
        `) as [{ updated_count: number }]
        if (rows[0].updated_count === 0) break
    }
}
```

Why the CTE wrap: a bare `UPDATE ... RETURNING` has non-portable return shape — PGlite gives you a rows array, node-postgres gives you `[rows, affectedCount]`. Reading `.length` on the node-postgres tuple always yields 2, so the loop never terminates in prod but passes locally. Wrapping in `WITH ... SELECT count(*)` makes the top-level statement a SELECT, which has uniform shape across both drivers. The chunk itself is still idempotent — the `WHERE col IS NULL` skips already-updated rows, so a crash mid-backfill resumes cleanly on retry.

### Constraint recipes

**Unique:**
```ts
// background migration
await migrationHelpers.createIndexConcurrently({
    queryRunner: q,
    name: 'idx_foo_unique',
    table: 'foo',
    columns: '"col"',
    unique: true,
})
```
```sql
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

**`NOT NULL` on existing column** (PG 12+). Three migrations across two releases. The background migration MUST do both the backfill AND the `VALIDATE CONSTRAINT` in one `up()` — splitting them lets Step 3's blocking `SET NOT NULL` boot against a non-validated CHECK, which forces Postgres into a full-table scan under ACCESS EXCLUSIVE. That reintroduces the exact boot stall this whole runner exists to prevent.

Step 1 — blocking, release N:
```sql
ALTER TABLE foo ADD CONSTRAINT foo_col_not_null CHECK (col IS NOT NULL) NOT VALID;
```

Step 2 — background, release N (backfill + validate, atomic from the guard's perspective):
```ts
public async up(q: QueryRunner): Promise<void> {
    while (true) {
        const rows = await q.query(`
            WITH updated AS (
                UPDATE foo SET col = <value>
                 WHERE id IN (SELECT id FROM foo WHERE col IS NULL LIMIT 1000)
                RETURNING 1
            )
            SELECT count(*)::int AS updated_count FROM updated
        `) as [{ updated_count: number }]
        if (rows[0].updated_count === 0) break
    }
    await q.query(`ALTER TABLE foo VALIDATE CONSTRAINT foo_col_not_null`)
}
```

Step 3 — blocking, release N+1 (guard implies both backfill and validate are done, so `SET NOT NULL` is metadata-only):
```ts
public async up(q: QueryRunner): Promise<void> {
    await migrationHelpers.assertBackgroundMigrationComplete({
        queryRunner: q,
        migration: BackfillAndValidateFooColNulls, // the single background migration above
    })
    await q.query(`ALTER TABLE foo ALTER COLUMN col SET NOT NULL`)
    await q.query(`ALTER TABLE foo DROP CONSTRAINT foo_col_not_null`)
}
```

### Rollback

- Blocking migrations: `down()` required unless `breaking = true`. `check-migration-rollback.ts` enforces the `breaking` flag on destructive DDL.
- Background migrations: forward-only. `down()` is a no-op body; the rollback tooling skips the `background/` folder entirely. To undo a bad backfill, ship a forward-fix migration.

### Rollback choreography when a blocking migration pairs with a background one

`withBackgroundMigrationLock` acquires the per-migration lock without checking the completion row. `down()` uses this instead of `assertBackgroundMigrationComplete` because rollback must proceed even when the backfill never ran, failed, or was quiesced mid-run — otherwise a release with an incomplete background migration becomes un-rollbackable.

**When `down()` needs the lock — only if its DDL touches objects a background migration also touches:**
- Same-release reshape pair (blocking adds columns, background CIC on same table): **lock**.
- `DROP COLUMN foo` while a background `BackfillFoo` could be in-flight: **lock**.
- Dependency-style pair (M1's up calls `assertBackgroundMigrationComplete(B)` + does `SET NOT NULL`; down drops NOT NULL): **no lock** — B is already complete and won't re-run.
- Any blocking migration whose paired background touches disjoint objects: **no lock**.

```ts
public async down(q: QueryRunner): Promise<void> {
    await migrationHelpers.withBackgroundMigrationLock({
        log: system.globalLogger(),
        migration: ReshapeFooIndexes,
        fn: async () => {
            await q.query(`...restore old indexes, drop new ones...`)
            await q.query(`DELETE FROM background_migrations WHERE name = $1`, [new ReshapeFooIndexes().name])
            await q.query(`ALTER TABLE foo DROP COLUMN bar`)
        },
    })
}
```

Deleting the `background_migrations` row is a per-migration choice — tells re-upgrade to re-run the reshape. Omit if `down()` leaves the background work's effects intact.

**Caveats:**
- Lock wait is bounded at ~4 min (`distributedLockFactory` passes `retryCount * retryDelay = (timeout / 200) * 200ms` into RedLock). If `down()` races a long in-flight backfill, the helper throws rather than waits for the full duration. Fix: scale API pods to 0 (quiesces the runner), re-run `rollback-migrations.ts`, redeploy.
- The helper opens a Redis connection inside the rollback CLI, which keeps the event loop alive after the last `down()`. `src/rollback.ts` therefore ends with `process.exit(0)`; without it the CLI prints "Rollback complete" and never exits.
- Destructive data changes a background migration already made (uuid migration, type change) cannot be rolled back by the framework. Ship a reverse-fix background migration or accept the residue.
- Rolling back release N with its background migration B already completed: B's data and row persist; re-deploy of N skips B. If wrong for your case, delete B's row in `down()`.

### Recovery — permanently failing background migrations

A background migration that fails every retry stops the app from booting. The guard refuses the dependent blocking DDL; boot catchup exhausts its 10 attempts and throws with the migration name. Operator options, in order of preference:

1. **Fix the data.** `background_migrations.last_error` names the failing SQL and often points at the problem row. Fix (`UPDATE`, `DELETE`, or correct application code that writes invalid data) and restart the pod. The runner retries automatically.
2. **Mark the backfill complete manually.** Dangerous — only when the backfill is a no-op for your data (e.g., the backfill fills a column you don't use, or all target rows already have the expected shape, or you plan to drop the column entirely in a later release).
   ```sql
   INSERT INTO background_migrations ("name", "executed_at")
   VALUES ('YourBackfillName1858000000000', NOW())
   ON CONFLICT ("name") DO UPDATE SET "executed_at" = NOW(), "failed_at" = NULL, "last_error" = NULL;
   ```
   Boot proceeds; dependent blocking DDL's guard passes.
3. **Upgrade to a release with a patch.** If Activepieces ships a corrected backfill, upgrading past it lands the fix.

## Gotchas

- **pglite doesn't support `CONCURRENTLY`.** `migrationHelpers.createIndexConcurrently` / `dropIndexConcurrently` fall back to plain `CREATE INDEX IF NOT EXISTS` / `DROP INDEX IF EXISTS` on pglite. Only affects local dev. Older migrations use an inline `const concurrently = isPGlite() ? '' : 'CONCURRENTLY'` ternary — don't reuse that pattern in new code, the helpers supersede it.
- **`breaking = true` is the ROLLBACK-safety flag, not the customer-facing "breaking change" label.** Two different concepts. The label is decided per the [PR labels rules](../../../CLAUDE.md#pull-requests); the flag is decided per what the migration's `down()` can undo.
- **Contract DDL in the same release as its backfill, skip-release upgrades, and fresh installs are all handled by boot catchup.** `runMigrationsWithCatchup` wraps TypeORM's `runMigrations`: when a blocking migration's guard throws `BackgroundMigrationNotCompleteError`, the catchup catches it, runs that one backfill synchronously, and retries. Max 10 catchup attempts (one per distinct dependency), then boot fails with the failing migration name. Normal upgrade pays nothing; skip-release pays a one-time slow boot while prior backfills catch up.
- **A brand-new hot-path index in the same release as the code that needs it can leave the app on seq scans while background CIC builds.** Only applies when there's *no* prior covering index for the query. Fixes: (a) ship the CIC in a prior release so it's built by the time the code lands (verify via `pendingCount` on `/v1/health/system`), or (b) put the CIC in the blocking track so the index is present when the app starts serving. Reshapes (replacing existing indexes) don't hit this — the old index keeps queries fast while new one builds.
- **Same-name migration in both folders would run twice.** The two history tables are independent — a rename or folder move without a seed-row migration double-executes on customers that already ran it in the old track.
- **Background migrations run on API pods only.** Workers don't register system-job handlers. Deployments with zero API pods will never finish backfills; not a supported topology, worth flagging if it comes up.
- **`check-migrations` and `db-migration` build their database with `src/migrate.ts`, not `typeorm migration:run`.** The CLI runs only the blocking track, so it reports every entity index that a background migration builds as drift. `migrate.ts` runs `runMigrationsWithCatchup` and then the background track, the boot order, through the same `distributedLock` as boot. It ends with `process.exit`: on memory Redis the lock starts redis-memory-server, whose open connection would keep the step from exiting, and the library's killer process stops `redis-server` once the parent is gone.

## Key files

- `packages/server/api/src/app/database/` — connection, migrations, helpers.
- `packages/server/api/src/app/database/postgres-connection.ts` — `getMigrations()`, `getBackgroundMigrations()`.
- `packages/server/api/src/app/database/migration.ts` — the `Migration` interface.
- `packages/server/api/src/app/database/background-migration.ts` — the `BackgroundMigration` interface.
- `packages/server/api/src/app/database/migration-helpers.ts` — `assertBackgroundMigrationComplete`, `withBackgroundMigrationLock`, `createIndexConcurrently`, `dropIndexConcurrently`.
- `packages/server/api/src/app/database/background-migration-runner.ts` — the BullMQ handler.
- `packages/server/api/src/migrate.ts` — both tracks in one process, for `check-migrations` and `db-migration`.
- `tools/scripts/check-migration-rollback.ts` — the CI check.

## Related pages

- [Tables](tables.md), [File Storage](file-storage.md), [Key-Value Store](key-value-store.md), [Audit Logs](audit-logs.md) — domain-specific storage.
- External: [Database Migrations Playbook](https://www.activepieces.com/docs/handbook/engineering/playbooks/database-migration) — general TypeORM mechanics.
