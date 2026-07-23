import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddStuckRunSweepIndex1817000000000 implements Migration {
    name = 'AddStuckRunSweepIndex1817000000000'
    breaking = false
    release = '0.86.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_updated_where_status_running"
                ON "flow_run" ("updated")
                WHERE status = 'RUNNING'
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_updated_where_status_running"
                ON "flow_run" ("updated")
                WHERE status = 'RUNNING'
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_run_updated_where_status_running"')
    }
}
