import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthConfigInAiProviders1766328841463 implements MigrationInterface {
    name = 'AddAuthConfigInAiProviders1766328841463'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_provider" ADD "authConfig" json
        `);
        await queryRunner.query(`
            UPDATE "ai_provider" SET "authConfig" = "config"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_provider" ALTER COLUMN "authConfig" SET NOT NULL
        `);
        await queryRunner.query(`
            UPDATE "ai_provider" SET "config" = "config"::jsonb - 'apiKey'
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_provider" DROP COLUMN "authConfig"
        `);
    }

}
