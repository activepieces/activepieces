import { AppConnectionWithoutSensitiveData, Mcp, McpAction } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type McpActionSchema = McpAction & {
    connection: AppConnectionWithoutSensitiveData | null
    mcp: Mcp
}

export const McpActionEntity = new EntitySchema<McpActionSchema>({
    name: 'mcp_action',
    columns: {
        ...BaseColumnSchemaPart,
        actionName: {
            type: String,
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
            name: 'idx_mcp_action_mcp_id',
            columns: ['mcpId'],
        },
        {
            name: 'idx_mcp_action_connection_id',
            columns: ['connectionId'],
        },
        {
            name: 'idx_mcp_action_mcp_id_piece_name_action_name',
            columns: ['mcpId', 'pieceName', 'actionName'],
            unique: true,
        },
    ],
    relations: {
        connection: {
            type: 'many-to-one',
            target: 'app_connection',
            joinColumn: {
                name: 'connectionId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_mcp_action_connection_id',
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