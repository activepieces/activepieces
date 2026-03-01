import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepNameToTestInFlowRunEntity1754330492027 implements MigrationInterface {
    name = 'AddStepNameToTestInFlowRunEntity1754330492027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "stepNameToTest" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "stepNameToTest"
        `)
    }

}
