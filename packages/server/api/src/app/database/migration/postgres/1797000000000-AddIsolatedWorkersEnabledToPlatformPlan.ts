import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddIsolatedWorkersEnabledToPlatformPlan1797000000000 implements Migration {
    name = 'AddIsolatedWorkersEnabledToPlatformPlan1797000000000'
    breaking = false
    release = '0.85.5'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "isolatedWorkersEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "isolatedWorkersEnabled" = false
            WHERE "isolatedWorkersEnabled" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "isolatedWorkersEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "isolatedWorkersEnabled"')
    }
}
