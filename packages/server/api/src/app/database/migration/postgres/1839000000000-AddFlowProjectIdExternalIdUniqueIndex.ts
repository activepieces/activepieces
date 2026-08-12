import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddFlowProjectIdExternalIdUniqueIndex1839000000000 implements Migration {
    name = 'AddFlowProjectIdExternalIdUniqueIndex1839000000000'
    breaking = false
    release = '0.89.1'
    // CONCURRENTLY (non-PGlite) is illegal inside a transaction, and a blocking
    // CREATE UNIQUE INDEX would stall flow writes on a large table during a rolling deploy.
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Resolve any pre-existing duplicates before adding the unique index, so the
        // migration succeeds on installs that accumulated them (e.g. via the old create
        // path that minted a fresh externalId and let redeploys duplicate a flow). Keep
        // the most recently updated flow per (projectId, externalId) and rename the rest
        // by appending their own (unique) id instead of dropping them — no flow is lost.
        //
        // Iterate: appending '_dup_<id>' can, on pathological data, produce a value that
        // already matches another flow's externalId (externalId and id share the apId
        // space), which would itself break the unique index. Each pass appends the row's
        // unique id, so any collision it introduces is a strictly smaller duplicate set
        // resolved on the next pass; this converges in one pass on real data. The pass
        // bound is the flow count (+1), which is provably sufficient: each pass makes at
        // least the longest-suffixed duplicate globally unique, so at most one pass per row
        // is ever needed — the loop can never stop early with duplicates still present.
        const HAS_DUPLICATE = `
            SELECT 1 FROM (
                SELECT ROW_NUMBER() OVER (
                    PARTITION BY "projectId", "externalId"
                    ORDER BY "updated" DESC, "created" DESC, "id" DESC
                ) AS rn
                FROM "flow"
            ) ranked
            WHERE ranked.rn > 1
            LIMIT 1
        `
        const RENAME_DUPLICATES = `
            UPDATE "flow"
            SET "externalId" = "externalId" || '_dup_' || "id"
            WHERE "id" IN (
                SELECT "id" FROM (
                    SELECT "id",
                           ROW_NUMBER() OVER (
                               PARTITION BY "projectId", "externalId"
                               ORDER BY "updated" DESC, "created" DESC, "id" DESC
                           ) AS rn
                    FROM "flow"
                ) ranked
                WHERE ranked.rn > 1
            )
        `
        const [{ count }] = await queryRunner.query('SELECT COUNT(*) AS "count" FROM "flow"')
        const maxPasses = Number(count) + 1
        for (let pass = 0; pass < maxPasses; pass++) {
            const remaining = await queryRunner.query(HAS_DUPLICATE)
            if (remaining.length === 0) {
                break
            }
            await queryRunner.query(RENAME_DUPLICATES)
        }
        // Enforce project-scoped uniqueness so two flows can never share an externalId,
        // including under concurrent creates that race past the service-level pre-check.
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "idx_flow_project_id_external_id"
                ON "flow" ("projectId", "externalId")
            `)
            return
        }
        // CONCURRENTLY does not lock out writes, so on a multi-replica rolling deploy a
        // still-running old replica (no uniqueness guard yet) can insert a duplicate after
        // the cleanup above and mark this build invalid, failing this boot. That is
        // self-correcting rather than fatal: transaction = false means the migration is not
        // recorded on failure, so the next boot re-runs, drops the invalid index (below),
        // re-cleans, and rebuilds — converging once the duplicate-minting old replicas are
        // gone. A single-instance install (the common self-host) has no concurrent writer
        // and never hits this. We keep the non-blocking build over a blocking one to avoid
        // stalling flow writes on a large table for the duration of index creation.
        //
        // A killed CONCURRENTLY build leaves the index behind marked invalid, where
        // IF NOT EXISTS would skip the retry and report success on an index the planner
        // never uses.
        const invalid = await queryRunner.query(`
            SELECT 1 FROM pg_class c
            JOIN pg_index i ON i.indexrelid = c.oid
            WHERE c.relname = 'idx_flow_project_id_external_id' AND NOT i.indisvalid
        `)
        if (invalid.length > 0) {
            await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "idx_flow_project_id_external_id"')
        }
        await queryRunner.query(`
            CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_project_id_external_id"
            ON "flow" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
