import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowIndexToTriggerSource1757555419075 implements MigrationInterface {
    name = 'AddFlowIndexToTriggerSource1757555419075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_flow_id" ON "trigger_source" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_project_id" ON "trigger_source" ("projectId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id"
        `)
    }

}
