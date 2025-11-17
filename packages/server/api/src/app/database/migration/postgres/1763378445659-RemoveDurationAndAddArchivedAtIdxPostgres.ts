import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveDurationAndAddArchivedAtIdxPostgres1763378445659 implements MigrationInterface {
    name = 'RemoveDurationAndAddArchivedAtIdxPostgres1763378445659'

    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
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
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_run_project_id_environment_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "environment",
                "archivedAt",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_run_project_id_environment_status_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "environment",
                "status",
                "archivedAt",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_run_project_id_flow_id_environment_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "archivedAt",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY "idx_run_project_id_flow_id_environment_status_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "status",
                "archivedAt",
                "created"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_flow_id_environment_status_archived_at_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_flow_id_environment_archived_at_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_status_archived_at_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_project_id_environment_archived_at_created_desc"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "projectId" character varying(21)
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
