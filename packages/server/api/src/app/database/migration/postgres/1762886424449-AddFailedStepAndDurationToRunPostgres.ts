import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFailedStepAndDurationToRunPostgres1762886424449 implements MigrationInterface {
    name = 'AddFailedStepAndDurationToRunPostgres1762886424449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "failedStepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "waitDuration" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "failedStep" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "archivedAt" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ALTER COLUMN "startTime" DROP NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" ALTER COLUMN "startTime" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "archivedAt"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "failedStep"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "waitDuration"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "failedStepName" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
        `)
    }

}
