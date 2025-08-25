import { AIUsage } from '@activepieces/common-ai'
import { Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../database/database-common'

export type AIUsageSchema = AIUsage & {
    project: Project
    platformId: string
}

export const AIUsageEntity = new EntitySchema<AIUsageSchema>({
    name: 'ai_usage',
    columns: {
        ...BaseColumnSchemaPart,
        provider: {
            type: String,
            nullable: false,
        },
        platformId: {
            type: String,
        },
        model: {
            type: String,
            nullable: false,
        },
        cost: {
            type: 'decimal',
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        metadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_ai_usage_project_created',
            columns: ['platformId', 'created', 'projectId'],
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_ai_usage_project_id',
            },
        },
    },
}) 