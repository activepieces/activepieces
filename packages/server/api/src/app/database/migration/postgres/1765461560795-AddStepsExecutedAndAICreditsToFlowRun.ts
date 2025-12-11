import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepsExecutedAndAICreditsToFlowRun1765461560795 implements MigrationInterface {
    name = 'AddStepsExecutedAndAICreditsToFlowRun1765461560795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "executedSteps" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ALTER COLUMN "executedSteps" SET DEFAULT 0,
            ALTER COLUMN "executedSteps" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "executedSteps"
        `)
    }

}
