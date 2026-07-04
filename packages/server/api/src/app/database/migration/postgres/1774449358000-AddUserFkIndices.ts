import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddUserFkIndices1774449358000 implements MigrationInterface {
    name = 'AddUserFkIndices1774449358000'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_triggered_by" ON "flow_run" ("triggeredBy")
            `)
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_flow_version_updated_by" ON "flow_version" ("updatedBy")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_triggered_by" ON "flow_run" ("triggeredBy")
            `)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_version_updated_by" ON "flow_version" ("updatedBy")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_triggered_by"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_flow_version_updated_by"
        `)
    }
}
