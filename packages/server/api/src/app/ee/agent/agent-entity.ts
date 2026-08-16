import { Agent, Project, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type AgentWithRelations = Agent & {
    owner: User
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
        ownerId: {
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
        visibility: {
            type: String,
            nullable: false,
        },
        sharedWithUserIds: {
            type: String,
            array: true,
            nullable: false,
            default: '{}',
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
        owner: {
            type: 'many-to-one',
            target: 'user',
            joinColumn: {
                name: 'ownerId',
                foreignKeyConstraintName: 'fk_agent_owner_id',
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
