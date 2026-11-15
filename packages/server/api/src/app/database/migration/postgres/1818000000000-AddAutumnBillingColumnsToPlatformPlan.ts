import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAutumnBillingColumnsToPlatformPlan1818000000000 implements Migration {
    name = 'AddAutumnBillingColumnsToPlatformPlan1818000000000'
    breaking = false
    release = '0.86.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "autumnCustomerId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "autumnApiKey" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "usersLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "scheduledUsersLimit" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "includedCredits" integer NOT NULL DEFAULT 0
        `)
        await queryRunner.query(`
            UPDATE "platform_plan" SET "includedCredits" = "includedAiCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ADD COLUMN IF NOT EXISTS "billedTeamProjectsLimit" integer
        `)
        await queryRunner.query(`
            UPDATE "platform_plan" SET "billedTeamProjectsLimit" = (
                CASE "teamProjectsLimit"
                    WHEN 'NONE' THEN 0
                    WHEN 'ONE' THEN 1
                    ELSE NULL
                END
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "includedAiCredits" SET DEFAULT 0
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "aiCreditsAutoTopUpState" SET DEFAULT 'disabled'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "agentsEnabled" SET DEFAULT true
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "teamProjectsLimit" SET DEFAULT 'NONE'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "teamProjectsLimit" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "agentsEnabled" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "aiCreditsAutoTopUpState" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" ALTER COLUMN "includedAiCredits" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "billedTeamProjectsLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "includedCredits"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "scheduledUsersLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "usersLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "autumnApiKey"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "autumnCustomerId"
        `)
    }
}
