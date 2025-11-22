import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLastUsedAtToApiKey1763378445660 implements MigrationInterface {
    name = 'AddLastUsedAtToApiKey1763378445660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "api_key"
            ADD "lastUsedAt" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "api_key"
            DROP COLUMN "lastUsedAt"
        `)
    }
}
