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
        status: {
            type: String,
            nullable: false,
        },
        token: {
            type: String,
            nullable: false,
        },
        enabledTools: {
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
        // idx_mcp_server_platform_id is a partial unique index (WHERE platformId IS NOT NULL)
        // managed by migration only — TypeORM doesn't support partial indices in entity schema
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
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
