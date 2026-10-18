import { AIProviderName, AiUsageEnvironment, AiUsageOrigin } from '@activepieces/core-utils'
import { Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema } from '../database/database-common'

export const AiUsageDailyEntity = new EntitySchema<AiUsageDailySchema>({
    name: 'ai_usage_daily',
    columns: {
        id: {
            type: String,
            length: 64,
            primary: true,
        },
        day: {
            type: 'date',
            nullable: false,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: true,
        },
        origin: {
            type: String,
            nullable: false,
        },
        environment: {
            type: String,
            nullable: false,
        },
        flowId: {
            ...ApIdSchema,
            nullable: true,
        },
        agentId: {
            ...ApIdSchema,
            nullable: true,
        },
        userId: {
            ...ApIdSchema,
            nullable: true,
        },
        provider: {
            type: String,
            nullable: false,
        },
        providerConfigId: {
            ...ApIdSchema,
            nullable: true,
        },
        modelId: {
            type: String,
            nullable: false,
        },
        calls: {
            type: Number,
            nullable: false,
            default: 0,
        },
        unpricedCalls: {
            type: Number,
            nullable: false,
            default: 0,
        },
        inputTokens: {
            type: 'bigint',
            nullable: false,
            default: 0,
        },
        outputTokens: {
            type: 'bigint',
            nullable: false,
            default: 0,
        },
        cacheReadTokens: {
            type: 'bigint',
            nullable: false,
            default: 0,
        },
        cacheWriteTokens: {
            type: 'bigint',
            nullable: false,
            default: 0,
        },
        reasoningTokens: {
            type: 'bigint',
            nullable: false,
            default: 0,
        },
        reportedCostUsd: {
            type: 'double precision',
            nullable: false,
            default: 0,
        },
        estimatedCostUsd: {
            type: 'double precision',
            nullable: false,
            default: 0,
        },
    },
    indices: [
        {
            name: 'idx_ai_usage_daily_platform_day',
            columns: ['platformId', 'day'],
        },
        {
            name: 'idx_ai_usage_daily_project_day',
            columns: ['projectId', 'day'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_ai_usage_daily_platform_id',
            },
        },
    },
})

export type AiUsageDaily = {
    id: string
    day: string
    platformId: string
    projectId: string | null
    origin: AiUsageOrigin
    environment: AiUsageEnvironment
    flowId: string | null
    agentId: string | null
    userId: string | null
    provider: AIProviderName
    providerConfigId: string | null
    modelId: string
    calls: number
    unpricedCalls: number
    inputTokens: string
    outputTokens: string
    cacheReadTokens: string
    cacheWriteTokens: string
    reasoningTokens: string
    reportedCostUsd: number
    estimatedCostUsd: number
}

type AiUsageDailySchema = AiUsageDaily & {
    platform: Platform
}
