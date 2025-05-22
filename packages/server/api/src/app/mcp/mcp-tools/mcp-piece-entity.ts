import { AppConnectionWithoutSensitiveData, Mcp, McpPiece } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, ARRAY_COLUMN_TYPE, BaseColumnSchemaPart } from '../../database/database-common'

type McpPieceSchema = McpPiece & {
    connection: AppConnectionWithoutSensitiveData | null
    mcp: Mcp
}

export const McpPieceEntity = new EntitySchema<McpPieceSchema>({
    name: 'mcp_piece',
    columns: {
        ...BaseColumnSchemaPart,
        pieceName: {
            type: String,
            nullable: false,
        },
        pieceVersion: {
            type: String,
            nullable: false,
        },
        actionNames: {
            type: ARRAY_COLUMN_TYPE,
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
    },
    indices: [
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
        mcp: {
            type: 'many-to-one',
            target: 'mcp',
            joinColumn: {
                name: 'mcpId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_action_mcp_id',
            },
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})