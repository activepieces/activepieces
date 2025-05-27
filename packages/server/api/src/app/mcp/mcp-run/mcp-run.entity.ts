import { Mcp, McpRun, McpTool, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type McpRunSchema = McpRun & {
    mcp: Mcp
    tool: McpTool
    project: Project
}

export const McpRunEntity = new EntitySchema<McpRunSchema>({
    name: 'mcp_run',
    columns: {
        ...BaseColumnSchemaPart,
        mcpId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        toolId: {
            ...ApIdSchema,
            nullable: true,
        },
        metadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        input: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        output: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_run_mcp_id',
            columns: ['mcpId'],
        },
        {
            name: 'idx_mcp_run_tool_id',
            columns: ['toolId'],
        },
        {
            name: 'idx_mcp_run_project_id',
            columns: ['projectId'],
        },
    ],
    relations: {
        mcp: {
            type: 'many-to-one',
            target: 'mcp',
            joinColumn: {
                name: 'mcpId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_run_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
        tool: {
            type: 'many-to-one',
            target: 'mcp_tool',
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'toolId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_run_tool_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_run_project_id',
            },
        },
    },
})