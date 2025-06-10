import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFailedStepIdToFlowRunTablePostgres1749560332604 implements MigrationInterface {
    name = 'AddFailedStepIdToFlowRunTablePostgres1749560332604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "failedStepId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            DROP COLUMN "failedStepId"
        `)
    }
}