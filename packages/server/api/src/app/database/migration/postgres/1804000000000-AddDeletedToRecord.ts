import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddDeletedToRecord1804000000000 implements Migration {
    name = 'AddDeletedToRecord1804000000000'
    breaking = false
    release = '0.85.5'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'

        await queryRunner.query(`
            ALTER TABLE "record"
            ADD COLUMN IF NOT EXISTS "deleted" TIMESTAMP WITH TIME ZONE
        `)

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_record_project_id_table_id"`)
        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_record_table_id_project_id_record_id"`)

        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_record_project_id_table_id"
            ON "record" ("projectId", "tableId")
            WHERE "deleted" IS NULL
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_record_table_id_project_id_record_id"
            ON "record" ("tableId", "projectId", "id")
            WHERE "deleted" IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite ? '' : 'CONCURRENTLY'

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_record_project_id_table_id"`)
        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_record_table_id_project_id_record_id"`)

        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_record_project_id_table_id"
            ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_record_table_id_project_id_record_id"
            ON "record" ("tableId", "projectId", "id")
        `)

        await queryRunner.query('ALTER TABLE "record" DROP COLUMN IF EXISTS "deleted"')
    }
}
