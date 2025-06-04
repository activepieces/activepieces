import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepToIssuesTablePostgres1748789709144 implements MigrationInterface {
    name = 'AddStepToIssuesTablePostgres1748789709144'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issue" 
            ADD COLUMN "stepId" varchar(21)
        `)

        await queryRunner.query(`
            ALTER TABLE "issue"
            DROP CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f"
        `)

        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId", "stepId")
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_issue_flow_id" ON "issue" ("flowId", "stepId")
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_issue_project_id_flow_id" ON "issue" ("projectId", "flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_issue_project_id_flow_id"')
        await queryRunner.query('DROP INDEX "idx_issue_flow_id"')

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
            DROP COLUMN "stepId"
        `)
    }
}
