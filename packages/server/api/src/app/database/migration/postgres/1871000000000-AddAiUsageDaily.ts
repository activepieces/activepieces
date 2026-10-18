import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiUsageDaily1871000000000 implements Migration {
    name = 'AddAiUsageDaily1871000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ai_usage_daily" (
                "id" character varying(64) NOT NULL,
                "day" date NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21),
                "origin" character varying NOT NULL,
                "environment" character varying NOT NULL,
                "flowId" character varying(21),
                "agentId" character varying(21),
                "userId" character varying(21),
                "provider" character varying NOT NULL,
                "providerConfigId" character varying(21),
                "modelId" character varying NOT NULL,
                "calls" integer NOT NULL DEFAULT 0,
                "unpricedCalls" integer NOT NULL DEFAULT 0,
                "inputTokens" bigint NOT NULL DEFAULT 0,
                "outputTokens" bigint NOT NULL DEFAULT 0,
                "cacheReadTokens" bigint NOT NULL DEFAULT 0,
                "cacheWriteTokens" bigint NOT NULL DEFAULT 0,
                "reasoningTokens" bigint NOT NULL DEFAULT 0,
                "reportedCostUsd" double precision NOT NULL DEFAULT 0,
                "estimatedCostUsd" double precision NOT NULL DEFAULT 0,
                CONSTRAINT "pk_ai_usage_daily" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_ai_usage_daily_platform_day" ON "ai_usage_daily" ("platformId", "day")
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_ai_usage_daily_project_day" ON "ai_usage_daily" ("projectId", "day")
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ai_usage_daily_platform_id') THEN
                    ALTER TABLE "ai_usage_daily" ADD CONSTRAINT "fk_ai_usage_daily_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_usage_daily"
        `)
    }
}
