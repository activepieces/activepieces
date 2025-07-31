import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUniqueOnFlow1750093037011 implements MigrationInterface {
    name = 'RemoveUniqueOnFlow1750093037011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issue" DROP CONSTRAINT "fk_issue_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue" DROP CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issue" DROP CONSTRAINT "fk_issue_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
