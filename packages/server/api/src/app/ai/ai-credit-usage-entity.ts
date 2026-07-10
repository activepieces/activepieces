import { BaseModelSchema } from '@activepieces/core-utils'
import { Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { z } from 'zod'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

const AiCreditUsage = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: z.string(),
    provider: z.string(),
    model: z.string(),
    day: z.string(),
    credits: z.number(),
})
type AiCreditUsage = z.infer<typeof AiCreditUsage>

export type AiCreditUsageSchema = AiCreditUsage & {
    platform: Platform
    project: Project
}

export const AiCreditUsageEntity = new EntitySchema<AiCreditUsageSchema>({
    name: 'ai_credit_usage',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        provider: {
            type: String,
            nullable: false,
        },
        model: {
            type: String,
            nullable: false,
        },
        day: {
            type: String,
            nullable: false,
        },
        credits: {
            type: 'float',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_ai_credit_usage_platform_project_provider_model_day',
            columns: ['platformId', 'projectId', 'provider', 'model', 'day'],
            unique: true,
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
                foreignKeyConstraintName: 'fk_ai_credit_usage_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_ai_credit_usage_project_id',
            },
        },
    },
})
