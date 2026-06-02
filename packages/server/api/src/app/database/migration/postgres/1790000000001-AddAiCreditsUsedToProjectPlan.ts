import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiCreditsUsedToProjectPlan1790000000001 implements Migration {
    name = 'AddAiCreditsUsedToProjectPlan1790000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD COLUMN "aiCreditsUsed" integer NOT NULL DEFAULT 0
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            DROP COLUMN "aiCreditsUsed"
        `)
    }
}
