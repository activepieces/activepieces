import { Agent, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type AgentWithRelations = Agent & {
    project: Project
}

export const AgentEntity = new EntitySchema<AgentWithRelations>({
    name: 'agent',
    columns: {
        ...BaseColumnSchemaPart,
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
