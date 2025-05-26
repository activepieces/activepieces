import { Mcp, McpTool, McpToolHistory, McpToolHistoryStatus } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../../database/database-common'

type McpToolHistorySchema = McpToolHistory & {
    mcp: Mcp
    tool: McpTool
}

export const McpToolHistoryEntity = new EntitySchema<McpToolHistorySchema>({
    name: 'mcp_tool_history',
    columns: {
        ...BaseColumnSchemaPart,
        mcpId: {
            ...ApIdSchema,
            nullable: false,
        },
        toolId: {
            ...ApIdSchema,
            nullable: false,
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
            type: 'enum',
            enum: McpToolHistoryStatus,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_tool_history_mcp_id',
            columns: ['mcpId'],
        },
        {
            name: 'idx_mcp_tool_history_tool_id',
            columns: ['toolId'],
        },
    ],
    relations: {
        mcp: {
            type: 'many-to-one',
            target: 'mcp',
            joinColumn: {
                name: 'mcpId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_tool_history_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
        tool: {
            type: 'many-to-one',
            target: 'mcp_tool',
            joinColumn: {
                name: 'toolId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_tool_history_tool_id',
            },
        },
    },
})