import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformBilling1734971881345 implements MigrationInterface {
    name = 'AddPlatformBilling1734971881345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_billing" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "includedTasks" integer NOT NULL,
                "includedAiCredits" integer NOT NULL,
                "tasksLimit" integer,
                "aiCreditsLimit" integer,
                "stripeCustomerId" character varying,
                "stripeSubscriptionId" character varying,
                "stripeSubscriptionStatus" character varying,
                CONSTRAINT "PK_6072e8a1b76e82a3593dcc75577" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_billing_platform_id" ON "platform_billing" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_billing"
            ADD CONSTRAINT "fk_platform_billing_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_billing" DROP CONSTRAINT "fk_platform_billing_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_billing_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_billing"
        `)
    }

}
