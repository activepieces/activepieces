import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveLastFreeAiCreditsRenewalDate1772027510000 implements MigrationInterface {
    name = 'RemoveLastFreeAiCreditsRenewalDate1772027510000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "lastFreeAiCreditsRenewalDate"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "lastFreeAiCreditsRenewalDate" timestamp with time zone
        `)
    }

}
