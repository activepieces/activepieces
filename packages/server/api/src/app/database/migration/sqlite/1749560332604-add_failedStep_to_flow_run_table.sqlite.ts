import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFailedstepNameToFlowRunTableSqlite1749560332604 implements MigrationInterface {
    name = 'AddFailedstepNameToFlowRunTableSqlite1749560332604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN "failedstepName" varchar(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step"
            ON "flow_run" ("flowId", "failedstepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            DROP COLUMN "failedstepName"
        `)
    }
}