import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddSelfServeTrialUsedElsewhereToPlatformPlan1877000000000 implements Migration {
    name = 'AddSelfServeTrialUsedElsewhereToPlatformPlan1877000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "selfServeTrialUsedElsewhereAt" TIMESTAMP WITH TIME ZONE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN IF EXISTS "selfServeTrialUsedElsewhereAt"
        `)
    }
}
