import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAutumnBillingColumnsToPlatformPlan1818000000000 implements Migration {
    name = 'AddAutumnBillingColumnsToPlatformPlan1818000000000'
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
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "agentsEnabled"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "agentsEnabled" boolean
        `)
        await queryRunner.query('UPDATE "platform_plan" SET "agentsEnabled" = NOT "embeddingEnabled"')
        await queryRunner.query('ALTER TABLE "platform_plan" ALTER COLUMN "agentsEnabled" SET NOT NULL')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "autumnApiKey"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "autumnCustomerId"')
    }
}
