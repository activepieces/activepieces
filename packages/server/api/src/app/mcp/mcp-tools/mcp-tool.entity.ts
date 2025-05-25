import { Mcp, McpTool, McpToolType } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type McpToolSchema = McpTool & {
    mcp: Mcp
}

export const McpToolEntity = new EntitySchema<McpToolSchema>({
    name: 'mcp_tool',
    columns: {
        ...BaseColumnSchemaPart,
        mcpId: ApIdSchema,
        type: {
            type: String,
            enum: McpToolType,
            nullable: false,
        },
        data: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_tool_mcp_id',
            columns: ['mcpId'],
        },
    ],
    relations: {
        mcp: {
            type: 'many-to-one',
            target: 'mcp',
            joinColumn: {
                name: 'mcpId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_tool_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})