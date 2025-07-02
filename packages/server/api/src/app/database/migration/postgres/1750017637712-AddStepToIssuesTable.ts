import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepToIssuesTable1750017637712 implements MigrationInterface {
    name = 'AddStepToIssuesTable1750017637712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "issue"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_issue_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_issue_project_id_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME COLUMN "count" TO "stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "failedStepName" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "issue" DROP COLUMN "stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD "stepName" character varying NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step" ON "flow_run" ("flowId", "failedStepName")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue" DROP COLUMN "stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD "stepName" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "failedStepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME COLUMN "stepName" TO "count"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_issue_project_id_flow_id" ON "issue" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flow_id" ON "issue" ("flowId")
        `)
    }

}
