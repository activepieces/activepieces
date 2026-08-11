import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFlowProjectIdExternalIdUniqueIndex1821000000000 implements Migration {
    name = 'AddFlowProjectIdExternalIdUniqueIndex1821000000000'
    breaking = false
    release = '0.87.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Resolve any pre-existing duplicates before adding the unique index, so the
        // migration succeeds on installs that accumulated them (e.g. via the old create
        // path that minted a fresh externalId and let redeploys duplicate a flow). Keep
        // the most recently updated flow per (projectId, externalId) and give the losers a
        // unique externalId instead of dropping them — no flow is lost.
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
        // Enforce project-scoped uniqueness so two flows can never share an externalId,
        // including under concurrent creates that race past the service-level pre-check.
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_flow_project_id_external_id"
            ON "flow" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id"')
    }
}
