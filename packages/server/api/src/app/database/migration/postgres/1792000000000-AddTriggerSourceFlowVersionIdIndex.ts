import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddTriggerSourceFlowVersionIdIndex1792000000000 implements MigrationInterface {
    name = 'AddTriggerSourceFlowVersionIdIndex1792000000000'
    release = '0.83.0'
    breaking = false
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_trigger_flow_version_id"
                ON "trigger_source" ("flowVersionId")
                WHERE "deleted" IS NULL
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trigger_flow_version_id"
                ON "trigger_source" ("flowVersionId")
                WHERE "deleted" IS NULL
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_trigger_flow_version_id"')
    }
}
