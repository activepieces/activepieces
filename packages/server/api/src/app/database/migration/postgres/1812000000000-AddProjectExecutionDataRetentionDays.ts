import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'


export class AddProjectExecutionDataRetentionDays1812000000000 implements Migration {
    name = 'AddProjectExecutionDataRetentionDays1812000000000'
    breaking = false
    release = '0.86.4'
    // No transaction: CONCURRENTLY index operations are illegal inside one.
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "executionDataRetentionDays" integer
        `)
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_file_project_id_type_created"
            ON "file" ("projectId", "type", "created")
        `)
        await queryRunner.query(`
            DROP INDEX ${concurrently} IF EXISTS "idx_file_project_id"
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_project_execution_data_retention_days"
            ON "project" ("executionDataRetentionDays")
            WHERE "executionDataRetentionDays" IS NOT NULL
        `)
    }

    // No CONCURRENTLY here: TypeORM always wraps down() in a transaction, and concurrent
    // index operations are illegal inside one.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_project_execution_data_retention_days"
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_file_project_id" ON "file" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_file_project_id_type_created"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "executionDataRetentionDays"
        `)
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
