import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class FlowExternalIdUniqueIgnoresDeleting1855000000000 implements Migration {
    name = 'FlowExternalIdUniqueIgnoresDeleting1855000000000'
    breaking = false
    release = '0.92.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY '
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id_partial"')
        await queryRunner.query(`
            CREATE UNIQUE INDEX ${concurrently}"idx_flow_project_id_external_id_partial"
            ON "flow" ("projectId", "externalId")
            WHERE "operationStatus" != 'DELETING'
        `)
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id"')
        await queryRunner.query('ALTER INDEX "idx_flow_project_id_external_id_partial" RENAME TO "idx_flow_project_id_external_id"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "flow"
            SET "externalId" = "id"
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
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_project_id_external_id"')
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_flow_project_id_external_id"
            ON "flow" ("projectId", "externalId")
        `)
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
