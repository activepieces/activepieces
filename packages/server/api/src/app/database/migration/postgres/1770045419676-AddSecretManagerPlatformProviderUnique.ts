import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSecretManagerPlatformProviderUnique1770045419676 implements MigrationInterface {
    name = 'AddSecretManagerPlatformProviderUnique1770045419676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_secret_manager_platform_id_provider_id" ON "secret_manager" ("platformId", "providerId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_secret_manager_platform_id_provider_id"
        `)
    }
}
