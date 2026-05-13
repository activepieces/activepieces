import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddProjectIdsGinIndexToAppConnection1787200000000 implements Migration {
    name = 'AddProjectIdsGinIndexToAppConnection1787200000000'
    breaking = false
    release = '0.83.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_app_connection_project_ids_gin"
                ON "app_connection" USING gin ("projectIds")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_app_connection_project_ids_gin"
                ON "app_connection" USING gin ("projectIds")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query('DROP INDEX IF EXISTS "idx_app_connection_project_ids_gin"')
        }
        else {
            await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "idx_app_connection_project_ids_gin"')
        }
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
