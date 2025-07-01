import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeStepNameOptional1750025401754 implements MigrationInterface {
    name = 'MakeStepNameOptional1750025401754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ALTER COLUMN "stepName" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ALTER COLUMN "stepName"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

}
