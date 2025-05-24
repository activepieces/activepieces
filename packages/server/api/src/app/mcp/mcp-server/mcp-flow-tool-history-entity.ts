import { Mcp, McpFlowToolHistory } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type McpFlowToolHistorySchema = McpFlowToolHistory & {
    mcp: Mcp
}

export const McpFlowToolHistoryEntity = new EntitySchema<McpFlowToolHistorySchema>({
    name: 'mcp_flow_tool_history',
    columns: {
        ...BaseColumnSchemaPart,
        mcpId: {
            ...ApIdSchema,
            nullable: false,
        },
        flowId: {
            ...ApIdSchema,
            nullable: false,
        },
        flowVersionId: {
            ...ApIdSchema,
            nullable: false,
        },
        toolName: {
            type: String,
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
        success: {
            type: Boolean,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_flow_tool_history_mcp_id',
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
                foreignKeyConstraintName: 'fk_mcp_flow_tool_history_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})