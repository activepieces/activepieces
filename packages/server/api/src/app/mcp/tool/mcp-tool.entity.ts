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
        mcpId: {
            ...ApIdSchema,
            nullable: false,
        },
        type: {
            type: String,
            enum: McpToolType,
            nullable: false,
        },
        pieceMetadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        flowId: {
            type: String,
            nullable: true,
        },
        externalId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_tool_mcp_id',
            columns: ['mcpId'],
        },
        {
            name: 'idx_mcp_tool_flow_id',
            columns: ['flowId'],
        },
    ],
    relations: {
        mcp: {
            type: 'many-to-one',
            target: 'mcp',
            joinColumn: {
                name: 'mcpId',
                referencedColumnName: 'id',
            },
            orphanedRowAction: 'delete',
            onDelete: 'CASCADE',
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
            },
        },
    },
})