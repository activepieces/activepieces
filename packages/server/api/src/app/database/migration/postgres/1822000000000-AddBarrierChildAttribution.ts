import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddBarrierChildAttribution1822000000000 implements Migration {
    name = 'AddBarrierChildAttribution1822000000000'
    breaking = false
    release = '0.87.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "parentWaitpointId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "dispatchIndex" integer
        `)

        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_parent_waitpoint_id"
            ON "flow_run" ("parentWaitpointId", "projectId", "dispatchIndex", "status")
            WHERE "parentWaitpointId" IS NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_env_status_created_archived_parent_waitpoint"
            ON "flow_run" ("projectId", "environment", "status", "created" DESC, "archivedAt", "parentWaitpointId")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_env_created_archived_status_parent_waitpoint"
            ON "flow_run" ("projectId", "environment", "created" DESC, "archivedAt", "status")
            WHERE "parentWaitpointId" IS NULL
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_env_flow_created_archived_parent_waitpoint"
            ON "flow_run" ("projectId", "environment", "flowId", "created" DESC, "archivedAt")
            WHERE "parentWaitpointId" IS NULL
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_env_flow_status_created_parent_waitpoint"
            ON "flow_run" ("projectId", "environment", "flowId", "status", "created" DESC, "archivedAt")
            WHERE "parentWaitpointId" IS NULL
        `)

        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_status_created_archived_at"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_created_status_archived_at"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_created_archived_at"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_flow_id_created_archived_at"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_id_environment_flow_id_status_created_archived_at"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_id_environment_status_created_archived_at"
            ON "flow_run" ("projectId", "environment", "status", "created" DESC, "archivedAt")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_id_environment_created_status_archived_at"
            ON "flow_run" ("projectId", "environment", "created" DESC, "archivedAt", "status")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_id_environment_created_archived_at"
            ON "flow_run" ("projectId", "environment", "created" DESC, "archivedAt")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_id_environment_flow_id_created_archived_at"
            ON "flow_run" ("projectId", "environment", "flowId", "created" DESC, "archivedAt")
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently()} IF NOT EXISTS "idx_run_project_id_environment_flow_id_status_created_archived_at"
            ON "flow_run" ("projectId", "environment", "flowId", "status", "created" DESC, "archivedAt")
        `)

        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_env_flow_status_created_parent_waitpoint"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_env_flow_created_archived_parent_waitpoint"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_env_created_archived_status_parent_waitpoint"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_project_env_status_created_archived_parent_waitpoint"`)
        await queryRunner.query(`DROP INDEX ${concurrently()} IF EXISTS "idx_run_parent_waitpoint_id"`)

        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN IF EXISTS "dispatchIndex"')
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN IF EXISTS "parentWaitpointId"')
    }
}

const concurrently = (): string => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE ? '' : 'CONCURRENTLY'
