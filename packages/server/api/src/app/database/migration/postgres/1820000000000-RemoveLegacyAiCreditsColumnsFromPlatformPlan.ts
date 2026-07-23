import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class RemoveLegacyAiCreditsColumnsFromPlatformPlan1820000000000 implements Migration {
    name = 'RemoveLegacyAiCreditsColumnsFromPlatformPlan1820000000000'
    breaking = true
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpState"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpThreshold"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpCreditsToAdd"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "maxAutoTopUpCreditsMonthly"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "lastFreeAiCreditsRenewalDate"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "aiCreditsAutoTopUpState" character varying NOT NULL DEFAULT \'disabled\'')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "aiCreditsAutoTopUpThreshold" integer')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "aiCreditsAutoTopUpCreditsToAdd" integer')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "maxAutoTopUpCreditsMonthly" integer')
        await queryRunner.query('ALTER TABLE "platform_plan" ADD "lastFreeAiCreditsRenewalDate" timestamp with time zone')
    }
}
