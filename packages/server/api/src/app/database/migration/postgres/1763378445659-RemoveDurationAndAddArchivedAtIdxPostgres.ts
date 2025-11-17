import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveDurationAndAddArchivedAtIdxPostgres1763378445659 implements MigrationInterface {
    name = 'RemoveDurationAndAddArchivedAtIdxPostgres1763378445659'

    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {

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
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_status_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "status",
                "created" DESC,
                "archivedAt"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "created" DESC,
                "archivedAt"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_project_id_environment_flow_id_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "flowId",
                "created" DESC,
                "archivedAt"
            )
        `)
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

}
