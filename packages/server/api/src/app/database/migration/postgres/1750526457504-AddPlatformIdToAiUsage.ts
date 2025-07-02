import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformIdToAiUsage1750526457504 implements MigrationInterface {
    name = 'AddPlatformIdToAiUsage1750526457504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "ai_usage"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)

        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD "platformId" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ALTER COLUMN "connectionIds"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ALTER COLUMN "connectionIds" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("created", "projectId")
        `)
    }

}
