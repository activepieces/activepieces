import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiCreditUsageTableSqlite1807000000001 implements Migration {
    name = 'AddAiCreditUsageTableSqlite1807000000001'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ai_credit_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "day" varchar NOT NULL,
                "credits" float NOT NULL,
                CONSTRAINT "fk_ai_credit_usage_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_ai_credit_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_credit_usage_platform_project_provider_model_day" ON "ai_credit_usage"
            ("platformId", "projectId", "provider", "model", "day")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "ai_credit_usage"')
    }
}
