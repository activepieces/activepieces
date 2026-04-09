import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiProvidersEnabledToPlatformPlan1775728983000 implements Migration {
    name = 'AddAiProvidersEnabledToPlatformPlan1775728983000'
    breaking = false
    release = '0.82.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "aiProvidersEnabled" boolean')
        await queryRunner.query('UPDATE "platform_plan" SET "aiProvidersEnabled" = CASE WHEN plan = \'standard\' THEN false ELSE true END')
        await queryRunner.query('ALTER TABLE "platform_plan" ALTER COLUMN "aiProvidersEnabled" SET NOT NULL')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "aiProvidersEnabled"')
    }
}
