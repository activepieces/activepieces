import { AppConnectionWithoutSensitiveData, McpPiece, McpPieceStatus } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type McpPieceSchema = McpPiece & {
    connection: AppConnectionWithoutSensitiveData | null
}

export const McpPieceEntity = new EntitySchema<McpPieceSchema>({
    name: 'mcp_piece',
    columns: {
        ...BaseColumnSchemaPart,
        pieceName: {
            type: String,
            nullable: false,
        },
        mcpId: {
            ...ApIdSchema,
            nullable: false,
        },
        connectionId: {
            ...ApIdSchema,
            nullable: true,
        },
        status: {
            type: String,
            enum: Object.values(McpPieceStatus),
            default: McpPieceStatus.ENABLED,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_piece_mcp_id',
            columns: ['mcpId'],
        },
        {
            name: 'idx_mcp_piece_connection_id',
            columns: ['connectionId'],
        },
        {
            name: 'idx_mcp_piece_mcp_id_piece_name',
            columns: ['mcpId', 'pieceName'],
            unique: true,
        },
    ],
    relations: {
        connection: {
            type: 'one-to-one',
            target: 'app_connection',
            joinColumn: {
                name: 'connectionId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_piece_connection_id',
            },
            onDelete: 'SET NULL',
            nullable: true,
        },
    },
})