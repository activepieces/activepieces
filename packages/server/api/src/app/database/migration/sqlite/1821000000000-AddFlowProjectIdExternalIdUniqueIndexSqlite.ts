import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowProjectIdExternalIdUniqueIndexSqlite1821000000000 implements MigrationInterface {
    name = 'AddFlowProjectIdExternalIdUniqueIndexSqlite1821000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Resolve any pre-existing duplicates before adding the unique index (see the
        // Postgres counterpart for the full rationale). Keep the most recently updated flow
        // per (projectId, externalId); rename the rest by appending their own unique id,
        // dropping nothing. Iterate until clean so an appended value that happens to match
        // another existing externalId is resolved on a later pass (bounded for safety).
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
        for (let pass = 0; pass < 100; pass++) {
            const remaining = await queryRunner.query(HAS_DUPLICATE)
            if (remaining.length === 0) {
                break
            }
            await queryRunner.query(RENAME_DUPLICATES)
        }
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_flow_project_id_external_id"
            ON "flow" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id"')
    }
}
