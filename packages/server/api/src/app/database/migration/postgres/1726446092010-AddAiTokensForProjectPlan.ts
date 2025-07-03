import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAiTokensForProjectPlan1726446092010 implements MigrationInterface {
    name = 'AddAiTokensForProjectPlan1726446092010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD COLUMN "aiTokens" integer
        `)
        await queryRunner.query(`
            UPDATE "project_plan"
            SET "aiTokens" = 0
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "aiTokens" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "aiTokens"
        `)
    }

}
