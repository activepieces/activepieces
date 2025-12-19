import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformAiCreditsPaymentTable1766186963979 implements MigrationInterface {
    name = 'AddPlatformAiCreditsPaymentTable1766186963979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_ai_credits_payment" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "amount" double precision NOT NULL,
                "aiCredits" double precision NOT NULL,
                "txId" character varying,
                "status" character varying NOT NULL,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_7b57d5d0d7eb5c45cb900684308" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageLimit"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsOverageState"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpCreditsToAdd" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpThreshold" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpState" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsAutoTopUpStripePaymentMethod" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_ai_credits_payment"
            ADD CONSTRAINT "fk_platform_ai_credits_payment_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_ai_credits_payment" DROP CONSTRAINT "fk_platform_ai_credits_payment_platform_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpStripePaymentMethod"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpState"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpThreshold"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "aiCreditsAutoTopUpCreditsToAdd"
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageState" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "aiCreditsOverageLimit" integer
        `);
        await queryRunner.query(`
            DROP TABLE "platform_ai_credits_payment"
        `);
    }

}
