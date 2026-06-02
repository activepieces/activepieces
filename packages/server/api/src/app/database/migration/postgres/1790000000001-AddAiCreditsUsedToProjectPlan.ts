import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiCreditsUsedToProjectPlan1790000000001 implements Migration {
    name = 'AddAiCreditsUsedToProjectPlan1790000000001'
    breaking = false
    release = '0.82.2'
    transaction = true

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
