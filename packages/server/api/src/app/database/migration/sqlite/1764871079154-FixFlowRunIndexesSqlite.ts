import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixFlowRunIndexes1764871079154 implements MigrationInterface {
    name = 'FixFlowRunIndexes1764871079154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_status_archived_at_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_flow_id_environment_archived_at_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_status_archived_at_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_archived_at_created_desc"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_flow_id_status_created_archived_" ON "flow_run" (
                "projectId",
                "environment",
                "flowId",
                "status",
                "created",
                "archivedAt"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_status_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "status",
                "created",
                "archivedAt"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "created",
                "archivedAt"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_flow_id_created_archived_at" ON "flow_run" (
                "projectId",
                "environment",
                "flowId",
                "created",
                "archivedAt"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_flow_id_created_archived_at"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_created_archived_at"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_status_created_archived_at"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_run_project_id_environment_flow_id_status_created_archived_"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "environment",
                "archivedAt",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_environment_status_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "environment",
                "status",
                "archivedAt",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "archivedAt",
                "created"
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_id_flow_id_environment_status_archived_at_created_desc" ON "flow_run" (
                "projectId",
                "flowId",
                "environment",
                "status",
                "archivedAt",
                "created"
            )
        `)
    }

}
