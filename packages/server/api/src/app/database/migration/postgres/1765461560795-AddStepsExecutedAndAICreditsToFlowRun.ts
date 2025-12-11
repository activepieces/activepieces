import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepsExecutedAndAICreditsToFlowRun1765461560795 implements MigrationInterface {
    name = 'AddStepsExecutedAndAICreditsToFlowRun1765461560795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "executedStepsCount" integer NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "aiCredits" integer NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ALTER COLUMN "verified"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ALTER COLUMN "verified"
            SET DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ALTER COLUMN "verified" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ALTER COLUMN "verified" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "aiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "executedStepsCount"
        `)
    }

}
