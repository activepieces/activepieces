import { Agent, Folder, Project, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type AgentWithRelations = Agent & {
    owner: User
    project: Project
    folder?: Folder
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
        folderId: {
            ...ApIdSchema,
            nullable: true,
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
        {
            name: 'idx_agent_folder_id',
            columns: ['folderId'],
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
        folder: {
            type: 'many-to-one',
            target: 'folder',
            onDelete: 'SET NULL',
            nullable: true,
            joinColumn: {
                name: 'folderId',
                foreignKeyConstraintName: 'fk_agent_folder_id',
            },
        },
    },
})
