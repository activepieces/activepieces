import { File, McpActivity, Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type McpActivityWithSchema = McpActivity & {
    platform: Platform
    project: Project
    file: File
}

export const ACTIVITY_ALIAS = 'mcp_activity'

export const McpActivityEntity = new EntitySchema<McpActivityWithSchema>({
    name: ACTIVITY_ALIAS,
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        projectId: {
            ...ApIdSchema,
            nullable: true,
        },
        userId: ApIdSchema,
        toolName: {
            type: String,
            length: 128,
            nullable: false,
        },
        status: {
            type: String,
            length: 32,
            nullable: false,
        },
        pieceName: {
            type: String,
            length: 256,
            nullable: true,
        },
        actionName: {
            type: String,
            length: 256,
            nullable: true,
        },
        connectionExternalId: {
            type: String,
            length: 256,
            nullable: true,
        },
        errorMessage: {
            type: String,
            length: 2000,
            nullable: true,
        },
        durationMs: {
            type: Number,
            nullable: false,
        },
        payloadFileId: {
            ...ApIdSchema,
            nullable: true,
        },
        payloadTruncated: {
            type: Boolean,
            nullable: false,
            default: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_activity_platform_id_created_id',
            columns: ['platformId', 'created', 'id'],
        },
        {
            name: 'idx_mcp_activity_project_id_created_id',
            columns: ['projectId', 'created', 'id'],
        },
        {
            name: 'idx_mcp_activity_payload_file_id',
            columns: ['payloadFileId'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_activity_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_activity_project_id',
            },
        },
        file: {
            type: 'many-to-one',
            target: 'file',
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'payloadFileId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_activity_payload_file_id',
            },
        },
    },
})
