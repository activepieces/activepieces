import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowProjectIdStatusIndex1772027509097 implements MigrationInterface {
    name = 'AddFlowProjectIdStatusIndex1772027509097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE INDEX "idx_flow_project_id_status" ON "flow" ("projectId", "status")',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_flow_project_id_status"')
    }
}
