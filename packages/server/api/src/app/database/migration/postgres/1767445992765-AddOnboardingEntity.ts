import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOnboardingEntity1767445992765 implements MigrationInterface {
    name = 'AddOnboardingEntity1767445992765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "onboarding" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "step" character varying NOT NULL,
                CONSTRAINT "PK_b8b6cfe63674aaee17874f033cf" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_onboarding_platform_id_step" ON "onboarding" ("platformId", "step")
        `)
        await queryRunner.query(`
            ALTER TABLE "onboarding"
            ADD CONSTRAINT "fk_onboarding_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "onboarding" DROP CONSTRAINT "fk_onboarding_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_onboarding_platform_id_step"
        `)
        await queryRunner.query(`
            DROP TABLE "onboarding"
        `)
    }

}
