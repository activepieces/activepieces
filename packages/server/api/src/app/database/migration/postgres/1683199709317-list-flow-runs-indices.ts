import { MigrationInterface, QueryRunner } from 'typeorm'

export class ListFlowRunsIndices1683199709317 implements MigrationInterface {
    name = 'ListFlowRunsIndices1683199709317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_run_project_id"')
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created" DESC) ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created" DESC) ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created" DESC) ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "status", "created" DESC) ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_created_desc"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id" ON "flow_run" ("projectId") ',
        )
    }
}
