import { McpServer, Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type McpServerWithSchema = McpServer & {
    platform: Platform
    project: Project
}

export const McpServerEntity = new EntitySchema<McpServerWithSchema>({
    name: 'mcp_server',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: true,
        },
        projectId: {
            ...ApIdSchema,
            nullable: true,
        },
        type: {
            type: String,
            nullable: false,
        },
        token: {
            type: String,
            nullable: false,
        },
        disabledTools: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'mcp_server_project_id',
            columns: ['projectId'],
            unique: true,
        },
        {
            name: 'idx_mcp_server_token',
            columns: ['token'],
            unique: true,
        },
        {
            name: 'idx_mcp_server_platform_id',
            columns: ['platformId'],
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
                foreignKeyConstraintName: 'fk_mcp_server_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
            },
        },
    },
})
