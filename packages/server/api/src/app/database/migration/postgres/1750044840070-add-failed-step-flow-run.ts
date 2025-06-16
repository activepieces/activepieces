import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFailedStepNameFlowRun1750044840070 implements MigrationInterface {
    name = 'AddFailedStepNameFlowRun1750044840070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "failedStepName" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "failedStepName"
        `)
    }
}
