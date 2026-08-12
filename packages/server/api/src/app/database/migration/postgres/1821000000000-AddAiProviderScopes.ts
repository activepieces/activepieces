import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiProviderScopes1821000000000 implements Migration {
    name = 'AddAiProviderScopes1821000000000'
    breaking = false
    release = '0.87.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_provider_platform_id_provider"
            ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD COLUMN "modelScope" character varying NOT NULL DEFAULT 'all',
            ADD COLUMN "modelIds" character varying array NOT NULL DEFAULT '{}',
            ADD COLUMN "projectScope" character varying NOT NULL DEFAULT 'all',
            ADD COLUMN "projectIds" character varying array NOT NULL DEFAULT '{}'
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ALTER COLUMN "modelIds" DROP DEFAULT,
            ALTER COLUMN "projectIds" DROP DEFAULT
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_provider_project_ids_gin"
            ON "ai_provider" USING GIN ("projectIds")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_ai_provider_project_ids_gin"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            DROP COLUMN "modelScope",
            DROP COLUMN "modelIds",
            DROP COLUMN "projectScope",
            DROP COLUMN "projectIds"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider"
            ON "ai_provider" ("platformId", "provider")
        `)
    }
}
