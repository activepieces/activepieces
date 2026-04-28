import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddRunStatusCoverIndex1777370308000 implements Migration {
    name = 'AddRunStatusCoverIndex1777370308000'
    breaking = false
    release = '0.82.2'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_project_id_environment_created_status"
                ON "flow_run" ("projectId", "environment", "created" DESC, "status")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_created_status"
                ON "flow_run" ("projectId", "environment", "created" DESC, "status")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query('DROP INDEX IF EXISTS "idx_run_project_id_environment_created_status"')
        }
        else {
            await queryRunner.query('DROP INDEX CONCURRENTLY IF EXISTS "idx_run_project_id_environment_created_status"')
        }
    }
}
