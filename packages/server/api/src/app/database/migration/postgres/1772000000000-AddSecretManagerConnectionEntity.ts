import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSecretManagerConnectionEntity1772000000000 implements MigrationInterface {
    name = 'AddSecretManagerConnectionEntity1772000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename table
        await queryRunner.query('ALTER TABLE "secret_manager" RENAME TO "secret_manager_connection"')
        // Drop old unique constraint
        await queryRunner.query('ALTER TABLE "secret_manager_connection" DROP CONSTRAINT IF EXISTS "idx_secret_manager_platform_id_provider_id"')
        // Rename index
        await queryRunner.query('ALTER INDEX IF EXISTS "idx_secret_manager_platform_id" RENAME TO "idx_secret_manager_connection_platform_id"')
        // Add new columns with defaults to preserve existing data
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ADD "scope" character varying NOT NULL DEFAULT \'PLATFORM\'')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ADD "projectIds" jsonb')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ADD "name" character varying NOT NULL DEFAULT \'\'')
        // Backfill name from providerId for existing rows
        await queryRunner.query('UPDATE "secret_manager_connection" SET "name" = "providerId" WHERE "name" = \'\'')
        // Drop default on name so new rows must supply it explicitly; keep default on scope
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ALTER COLUMN "name" DROP DEFAULT')
        // Rename FK constraint
        await queryRunner.query('ALTER TABLE "secret_manager_connection" RENAME CONSTRAINT "fk_secret_manager_platform_id" TO "fk_secret_manager_connection_platform_id"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "secret_manager_connection" RENAME CONSTRAINT "fk_secret_manager_connection_platform_id" TO "fk_secret_manager_platform_id"')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ALTER COLUMN "scope" DROP DEFAULT')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ALTER COLUMN "name" SET DEFAULT \'\'')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" DROP COLUMN "name"')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" DROP COLUMN "projectIds"')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" DROP COLUMN "scope"')
        await queryRunner.query('ALTER INDEX IF EXISTS "idx_secret_manager_connection_platform_id" RENAME TO "idx_secret_manager_platform_id"')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" ADD CONSTRAINT "idx_secret_manager_platform_id_provider_id" UNIQUE ("platformId", "providerId")')
        await queryRunner.query('ALTER TABLE "secret_manager_connection" RENAME TO "secret_manager"')
    }
}
