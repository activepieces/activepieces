import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepsExecutedAndAICreditsToFlowRun1765461560795 implements MigrationInterface {
    name = 'AddStepsExecutedAndAICreditsToFlowRun1765461560795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.hasColumn('flow_run', 'stepsCount')
        if (columnExists) {
            await queryRunner.query(`
                UPDATE "flow_run" SET "stepsCount" = 0 WHERE "stepsCount" IS NULL
            `)
            await queryRunner.query(`
                ALTER TABLE "flow_run" ALTER COLUMN "stepsCount" SET DEFAULT 0
            `)
            await queryRunner.query(`
                ALTER TABLE "flow_run" ALTER COLUMN "stepsCount" SET NOT NULL
            `)
            return
        }
        await queryRunner.query(`
            ALTER TABLE "flow_run" ADD "stepsCount" integer NOT NULL DEFAULT 0
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "stepsCount"
        `)
    }

}
