import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAutumnBillingColumnsToPlatformPlan1797000000000 implements Migration {
    name = 'AddAutumnBillingColumnsToPlatformPlan1797000000000'
    breaking = false
    release = '0.85.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "autumnCustomerId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "autumnApiKey" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "autumnApiKey"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "autumnCustomerId"')
    }
}
