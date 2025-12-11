import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepsExecutedAndAICreditsToFlowRun1765461560795 implements MigrationInterface {
    name = 'AddStepsExecutedAndAICreditsToFlowRun1765461560795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "executedStepsCount" integer NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "aiCredits" integer NOT NULL DEFAULT '0'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "aiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "executedStepsCount"
        `)
    }

}
