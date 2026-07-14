import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddRetentionCleanupIndexes1811000000000 implements Migration {
    name = 'AddRetentionCleanupIndexes1811000000000'
    breaking = false
    release = '0.103.1'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
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
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
