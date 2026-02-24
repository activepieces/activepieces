import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class RemoveDurationAndAddArchivedAtIdxPostgres1763378445659 implements MigrationInterface {
    name = 'RemoveDurationAndAddArchivedAtIdxPostgres1763378445659'

    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrent = !isPGlite

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_flow_id_status_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "flowId",
                    "status",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_project_id_environment_flow_id_status_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "flowId",
                    "status",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_status_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "status",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_project_id_environment_status_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "status",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_project_id_environment_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_flow_id_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "flowId",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_project_id_environment_flow_id_created_archived_at" ON "flow_run" (
                    "projectId",
                    "environment",
                    "flowId",
                    "created" DESC,
                    "archivedAt"
                )
            `)
        }

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_status_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_flow_id_environment_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_flow_id_environment_status_created_desc"
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "duration"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "waitDuration"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrent = !isPGlite

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_flow_id_created_archived_at"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_created_archived_at"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_status_created_archived_at"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_flow_id_status_created_archived_at"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "waitDuration" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "duration" integer
        `)

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" (
                    "created",
                    "projectId",
                    "flowId",
                    "environment",
                    "status"
                )
            `)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("created", "projectId", "flowId", "environment")
            `)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("created", "projectId", "environment", "status")
            `)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY "idx_run_project_id_environment_created_desc" ON "flow_run" ("created", "projectId", "environment")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" (
                    "created",
                    "projectId",
                    "flowId",
                    "environment",
                    "status"
                )
            `)
            await queryRunner.query(`
                CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("created", "projectId", "flowId", "environment")
            `)
            await queryRunner.query(`
                CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("created", "projectId", "environment", "status")
            `)
            await queryRunner.query(`
                CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("created", "projectId", "environment")
            `)
        }
    }

}