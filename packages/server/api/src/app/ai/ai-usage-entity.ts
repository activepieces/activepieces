import { AIUsage, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

export type AIUsageSchema = AIUsage & {
    project: Project
}

export const AIUsageEntity = new EntitySchema<AIUsageSchema>({
    name: 'ai_usage',
    columns: {
        ...BaseColumnSchemaPart,
        provider: {
            type: String,
            nullable: false,
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
    },
    indices: [
        {
            name: 'idx_ai_usage_project_created',
            columns: ['projectId', 'created'],
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