import { Agent, Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type AgentWithRelations = Agent & {
    platform: Platform
    project: Project
}

export const AgentEntity = new EntitySchema<AgentWithRelations>({
    name: 'agent',
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
        externalId: {
            type: String,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: true,
        },
        icon: {
            type: String,
            nullable: false,
        },
        color: {
            type: String,
            nullable: false,
        },
        draft: {
            type: 'jsonb',
            nullable: false,
        },
        published: {
            type: 'jsonb',
            nullable: true,
        },
        publishedAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_agent_project_created_id',
            columns: ['projectId', 'created', 'id'],
        },
        {
            name: 'idx_agent_project_external_id',
            columns: ['projectId', 'externalId'],
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
                foreignKeyConstraintName: 'fk_agent_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_agent_project_id',
            },
        },
    },
})
