import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDisplayNameToAiProviders1765757655723 implements MigrationInterface {
    name = 'AddDisplayNameToAiProviders1765757655723'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider" ADD "displayName" character varying;
        `)
        await queryRunner.query(`
            UPDATE "ai_provider" SET "displayName" = "provider";
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider" ALTER COLUMN "displayName" SET NOT NULL;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_provider" DROP COLUMN "displayName"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
    }

}
