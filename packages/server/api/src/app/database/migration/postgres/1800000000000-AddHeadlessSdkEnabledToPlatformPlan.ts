import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddHeadlessSdkEnabledToPlatformPlan1800000000000 implements Migration {
    name = 'AddHeadlessSdkEnabledToPlatformPlan1800000000000'
    breaking = false
    release = '0.85.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "headlessSdkEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "headlessSdkEnabled" = false
            WHERE "headlessSdkEnabled" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "headlessSdkEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "headlessSdkEnabled"')
    }
}
