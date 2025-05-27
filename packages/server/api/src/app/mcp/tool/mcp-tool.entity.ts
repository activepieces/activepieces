import { Flow, Mcp, McpTool, McpToolType } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type McpToolSchema = McpTool & {
    mcp: Mcp
    flow: Flow
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
        pieceMetadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        flowId: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_mcp_tool_mcp_id',
            columns: ['mcpId'],
        },
    ],
    relations: {
        flow: {
            type: 'many-to-one',
            target: 'flow',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
            },
        },
    },
})