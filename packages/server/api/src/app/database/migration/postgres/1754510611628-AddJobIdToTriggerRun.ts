import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddJobIdToTriggerRun1754510611628 implements MigrationInterface {
    name = 'AddJobIdToTriggerRun1754510611628'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "trigger_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
            ADD "jobId" character varying NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_run_job_id" ON "trigger_run" ("jobId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_trigger_run_job_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run" DROP COLUMN "jobId"
        `)
    }

}
