import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformAiCreditsPaymentTable1766186963979 implements MigrationInterface {
    name = 'AddPlatformAiCreditsPaymentTable1766186963979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageLimit"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageState"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpCreditsToAdd" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpThreshold" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpState" character varying
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "aiCreditsAutoTopUpState" = 'disabled'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "aiCreditsAutoTopUpState" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "lastFreeAiCreditsRenewalDate" timestamp with time zone
        `)
 
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "lastFreeAiCreditsRenewalDate"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpState"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpThreshold"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpCreditsToAdd"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageState" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageLimit" integer
        `)
    }

}
