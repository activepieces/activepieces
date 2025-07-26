import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFeatureToAIUsagePostgres1753264516213 implements MigrationInterface {
    name = 'AddFeatureToAIUsagePostgres1753264516213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD "feature" character varying NOT NULL DEFAULT 'Unknown'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP COLUMN "feature"
        `)
    }

}
