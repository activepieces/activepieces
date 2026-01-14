import { MigrationInterface, QueryRunner } from 'typeorm'

export class PlatformIdAndProviderUnique1766375959255 implements MigrationInterface {
    name = 'PlatformIdAndProviderUnique1766375959255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_provider_platform_id_provider"
        `)
    }

}
