import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiUsageTables1877000000000 implements Migration {
    name = 'AddAiUsageTables1877000000000'
    breaking = false
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ai_usage_5m" (
                "bucket" TIMESTAMP WITH TIME ZONE NOT NULL,
                "seriesId" character varying(32) NOT NULL,
                ${USAGE_COLUMNS},
                CONSTRAINT "pk_ai_usage_5m" PRIMARY KEY ("bucket", "seriesId")
            ) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.02)
        `)
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_ai_usage_5m_platform_id_bucket" ON "ai_usage_5m" ("platformId", "bucket")')
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ai_usage_daily" (
                "day" date NOT NULL,
                "seriesId" character varying(32) NOT NULL,
                ${USAGE_COLUMNS},
                CONSTRAINT "pk_ai_usage_daily" PRIMARY KEY ("day", "seriesId"),
                CONSTRAINT "fk_ai_usage_daily_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            ) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.02)
        `)
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_ai_usage_daily_platform_id_day" ON "ai_usage_daily" ("platformId", "day")')
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ai_usage_copy_cursor" (
                "platformId" character varying(21) NOT NULL,
                "copiedUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
                "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "pk_ai_usage_copy_cursor" PRIMARY KEY ("platformId"),
                CONSTRAINT "fk_ai_usage_copy_cursor_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ai_usage_run" (
                "runId" character varying(21) NOT NULL,
                "seenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "pk_ai_usage_run" PRIMARY KEY ("runId")
            )
        `)
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_ai_usage_run_seen_at" ON "ai_usage_run" ("seenAt")')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage_run"')
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage_copy_cursor"')
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage_daily"')
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage_5m"')
    }
}

const USAGE_COLUMNS = `
    "platformId" character varying(21) NOT NULL,
    "projectId" character varying(21),
    "flowId" character varying(21),
    "agentId" character varying(21),
    "userId" character varying(21),
    "provider" character varying NOT NULL,
    "providerConfigId" character varying(21),
    "modelId" character varying NOT NULL,
    "origin" character varying NOT NULL,
    "environment" character varying NOT NULL,
    "calls" integer NOT NULL DEFAULT 0,
    "unpricedCalls" integer NOT NULL DEFAULT 0,
    "runs" integer NOT NULL DEFAULT 0,
    "inputTokens" bigint NOT NULL DEFAULT 0,
    "outputTokens" bigint NOT NULL DEFAULT 0,
    "cacheReadTokens" bigint NOT NULL DEFAULT 0,
    "cacheWriteTokens" bigint NOT NULL DEFAULT 0,
    "reasoningTokens" bigint NOT NULL DEFAULT 0,
    "reportedCostUsd" double precision NOT NULL DEFAULT 0,
    "estimatedCostUsd" double precision NOT NULL DEFAULT 0,
    "spendUsd" double precision NOT NULL DEFAULT 0,
    "managedCredits" double precision NOT NULL DEFAULT 0`
