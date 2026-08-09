import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddParentWaitpointIdToRunStatusCountIndex1823000000000 implements Migration {
    name = 'AddParentWaitpointIdToRunStatusCountIndex1823000000000'
    breaking = false
    release = '0.86.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_env_status_created_archived_parent_waitpoint"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_env_status_created_archived_parent_waitpoint"
            ON "flow_run" ("projectId", "environment", "status", "created" DESC, "archivedAt", "parentWaitpointId")
        `)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_status_created_archived_at"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_status_created_archived_at"`)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_id_environment_status_created_archived_at"
            ON "flow_run" ("projectId", "environment", "status", "created" DESC, "archivedAt")
        `)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_env_status_created_archived_parent_waitpoint"`)
    }
}

const concurrently = (): string => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE ? '' : 'CONCURRENTLY'
