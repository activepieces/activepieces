import { AIProviderName, AiUsageEnvironment, AiUsageOrigin } from '@activepieces/core-utils'
import { Platform } from '@activepieces/shared'
import { EntitySchema, EntitySchemaColumnOptions } from 'typeorm'
import { ApIdSchema } from '../../database/database-common'

function usageColumns(): Record<keyof AiUsageColumns, EntitySchemaColumnOptions> {
    return {
        platformId: { ...ApIdSchema, nullable: false },
        projectId: { ...ApIdSchema, nullable: true },
        flowId: { ...ApIdSchema, nullable: true },
        agentId: { ...ApIdSchema, nullable: true },
        userId: { ...ApIdSchema, nullable: true },
        provider: { type: String, nullable: false },
        providerConfigId: { ...ApIdSchema, nullable: true },
        modelId: { type: String, nullable: false },
        origin: { type: String, nullable: false },
        environment: { type: String, nullable: false },
        calls: counter({ type: 'integer' }),
        unpricedCalls: counter({ type: 'integer' }),
        runs: counter({ type: 'integer' }),
        inputTokens: counter({ type: 'bigint' }),
        outputTokens: counter({ type: 'bigint' }),
        cacheReadTokens: counter({ type: 'bigint' }),
        cacheWriteTokens: counter({ type: 'bigint' }),
        reasoningTokens: counter({ type: 'bigint' }),
        reportedCostUsd: counter({ type: 'double precision' }),
        estimatedCostUsd: counter({ type: 'double precision' }),
        spendUsd: counter({ type: 'double precision' }),
        managedCredits: counter({ type: 'double precision' }),
    }
}

function counter({ type }: { type: 'integer' | 'bigint' | 'double precision' }): EntitySchemaColumnOptions {
    return { type, nullable: false, default: 0 }
}

export const AiUsage5mEntity = new EntitySchema<AiUsage5mSchema>({
    name: 'ai_usage_5m',
    columns: {
        bucket: {
            type: 'timestamp with time zone',
            primary: true,
            primaryKeyConstraintName: 'pk_ai_usage_5m',
        },
        seriesId: {
            type: String,
            length: 32,
            primary: true,
            primaryKeyConstraintName: 'pk_ai_usage_5m',
        },
        ...usageColumns(),
    },
    indices: [
        {
            name: 'idx_ai_usage_5m_platform_id_bucket',
            columns: ['platformId', 'bucket'],
        },
    ],
})

export const AiUsageDailyEntity = new EntitySchema<AiUsageDailySchema>({
    name: 'ai_usage_daily',
    columns: {
        day: {
            type: 'date',
            primary: true,
            primaryKeyConstraintName: 'pk_ai_usage_daily',
        },
        seriesId: {
            type: String,
            length: 32,
            primary: true,
            primaryKeyConstraintName: 'pk_ai_usage_daily',
        },
        ...usageColumns(),
    },
    indices: [
        {
            name: 'idx_ai_usage_daily_platform_id_day',
            columns: ['platformId', 'day'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_ai_usage_daily_platform_id',
            },
        },
    },
})

export const AiUsageCopyCursorEntity = new EntitySchema<AiUsageCopyCursorSchema>({
    name: 'ai_usage_copy_cursor',
    columns: {
        platformId: {
            ...ApIdSchema,
            primary: true,
            primaryKeyConstraintName: 'pk_ai_usage_copy_cursor',
        },
        copiedUntil: {
            type: 'timestamp with time zone',
            nullable: false,
        },
        startedAt: {
            type: 'timestamp with time zone',
            nullable: false,
        },
    },
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_ai_usage_copy_cursor_platform_id',
            },
        },
    },
})

export const AiUsageRunEntity = new EntitySchema<AiUsageRunSchema>({
    name: 'ai_usage_run',
    columns: {
        runId: {
            ...ApIdSchema,
            primary: true,
            primaryKeyConstraintName: 'pk_ai_usage_run',
        },
        seenAt: {
            type: 'timestamp with time zone',
            nullable: false,
            default: () => 'now()',
        },
    },
    indices: [
        {
            name: 'idx_ai_usage_run_seen_at',
            columns: ['seenAt'],
        },
    ],
})

type AiUsageColumns = {
    platformId: string
    projectId: string | null
    flowId: string | null
    agentId: string | null
    userId: string | null
    provider: AIProviderName
    providerConfigId: string | null
    modelId: string
    origin: AiUsageOrigin
    environment: AiUsageEnvironment
    calls: number
    unpricedCalls: number
    runs: number
    inputTokens: string
    outputTokens: string
    cacheReadTokens: string
    cacheWriteTokens: string
    reasoningTokens: string
    reportedCostUsd: number
    estimatedCostUsd: number
    spendUsd: number
    managedCredits: number
}

export type AiUsage5mSchema = AiUsageColumns & {
    bucket: string
    seriesId: string
}

export type AiUsageDailySchema = AiUsageColumns & {
    day: string
    seriesId: string
    platform?: Platform
}

export type AiUsageCopyCursorSchema = {
    platformId: string
    copiedUntil: string
    startedAt: string
    platform?: Platform
}

export type AiUsageRunSchema = {
    runId: string
    seenAt: string
}
