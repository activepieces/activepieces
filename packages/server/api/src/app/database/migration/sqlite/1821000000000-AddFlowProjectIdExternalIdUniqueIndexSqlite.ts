import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowProjectIdExternalIdUniqueIndexSqlite1821000000000 implements MigrationInterface {
    name = 'AddFlowProjectIdExternalIdUniqueIndexSqlite1821000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Resolve any pre-existing duplicates before adding the unique index (see the
        // Postgres counterpart). Keep the most recently updated flow per
        // (projectId, externalId); give the losers a unique externalId, dropping nothing.
        await queryRunner.query(`
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
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_flow_project_id_external_id"
            ON "flow" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id"')
    }
}
