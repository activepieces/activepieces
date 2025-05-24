import { Mcp, McpPieceToolHistory } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type McpPieceToolHistorySchema = McpPieceToolHistory & {
    mcp: Mcp
}

export const McpPieceToolHistoryEntity = new EntitySchema<McpPieceToolHistorySchema>({
    name: 'mcp_piece_tool_history',
    columns: {
        ...BaseColumnSchemaPart,
        mcpId: {
            ...ApIdSchema,
            nullable: false,
        },
        pieceName: {
            type: String,
            nullable: false,
        },
        pieceVersion: {
            type: String,
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
            name: 'idx_mcp_piece_tool_history_mcp_id',
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
                foreignKeyConstraintName: 'fk_mcp_piece_tool_history_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})