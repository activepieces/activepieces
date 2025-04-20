import { Mcp, McpPieceWithConnection } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'


type McpSchema = Mcp & {
    pieces: McpPieceWithConnection[]
}

export const McpEntity = new EntitySchema<McpSchema>({
    name: 'mcp',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        token: ApIdSchema,
    },
    indices: [
        {
            name: 'mcp_project_id',
            columns: ['projectId'],
            unique: true,
        },
    ],
    relations: {
        pieces: {
            type: 'one-to-many',
            target: 'mcp_piece',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
    
})

