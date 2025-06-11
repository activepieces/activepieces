import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepToIssuesTablePostgres1748789709144 implements MigrationInterface {
    name = 'AddStepToIssuesTablePostgres1748789709144'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issue" 
            ADD COLUMN "stepName" varchar(21)
        `)

        await queryRunner.query(`
            ALTER TABLE "issue"
            DROP CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f"
        `)

        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId", "stepName")
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_issue_flowId_StepId" ON "issue" ("flowId", "stepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_issue_flowId_StepId"')

        await queryRunner.query(`
            ALTER TABLE "issue"
            DROP CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f"
        `)

        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
        `)

        await queryRunner.query(`
            ALTER TABLE "issue" 
            DROP COLUMN "stepName"
        `)
    }
}
