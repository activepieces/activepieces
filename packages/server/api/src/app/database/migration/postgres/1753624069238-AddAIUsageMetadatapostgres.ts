import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAIUsageMetadatapostgres1753624069238 implements MigrationInterface {
    name = 'AddAIUsageMetadatapostgres1753624069238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD "metadata" jsonb NOT NULL DEFAULT '{"feature": "Unknown"}'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP COLUMN "metadata"
        `)
    }

}
