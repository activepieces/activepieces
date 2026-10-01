import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddFlowProjectIdExternalIdUniqueIndex1839000000000 implements Migration {
    name = 'AddFlowProjectIdExternalIdUniqueIndex1839000000000'
    breaking = false
    release = '0.88.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'

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

        await queryRunner.query(`
            CREATE UNIQUE INDEX ${concurrently} IF NOT EXISTS "idx_flow_project_id_external_id"
            ON "flow" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_flow_project_id_external_id"`)
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
