import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddConnectionIdsGinIndexToFlowVersion1804000000000 implements Migration {
    name = 'AddConnectionIdsGinIndexToFlowVersion1804000000000'
    breaking = false
    release = '0.86.1'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_flow_version_connection_ids_gin"
                ON "flow_version" USING gin ("connectionIds")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_version_connection_ids_gin"
                ON "flow_version" USING gin ("connectionIds")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_version_connection_ids_gin"')
        }
        else {
            await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "idx_flow_version_connection_ids_gin"')
        }
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
