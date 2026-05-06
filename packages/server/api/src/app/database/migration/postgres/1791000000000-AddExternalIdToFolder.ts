import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddExternalIdToFolder1791000000000 implements Migration {
    name = 'AddExternalIdToFolder1791000000000'
    breaking = false
    release = '0.83.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'

        await queryRunner.query(`
            ALTER TABLE "folder"
            ADD COLUMN IF NOT EXISTS "externalId" character varying
        `)

        await queryRunner.query(`
            UPDATE "folder"
            SET "externalId" = "id"
            WHERE "externalId" IS NULL
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX ${concurrently} IF NOT EXISTS "idx_folder_project_id_external_id"
            ON "folder" ("projectId", "externalId")
            WHERE "externalId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_folder_project_id_external_id"`)
        await queryRunner.query('ALTER TABLE "folder" DROP COLUMN IF EXISTS "externalId"')
    }
}
