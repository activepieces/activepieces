import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEnterpriseTrialToPlatformPlan1859000000000 implements Migration {
    name = 'AddEnterpriseTrialToPlatformPlan1859000000000'
    breaking = false
    release = '0.92.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "enterpriseTrialStartedAt" TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS "enterpriseTrialEndsAt" TIMESTAMP WITH TIME ZONE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN IF EXISTS "enterpriseTrialStartedAt",
            DROP COLUMN IF EXISTS "enterpriseTrialEndsAt"
        `)
    }
}
