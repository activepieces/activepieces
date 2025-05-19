import { Mcp, McpActionWithConnection } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'


type McpSchema = Mcp & {
    actions: McpActionWithConnection[]
}

export const McpEntity = new EntitySchema<McpSchema>({
    name: 'mcp',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            default: 'MCP Server',
        },
        projectId: ApIdSchema,
        token: ApIdSchema,
    },
    indices: [
        {
            name: 'mcp_project_id',
            columns: ['projectId'],
            unique: false,
        },
    ],
    relations: {
        actions: {
            type: 'one-to-many',
            target: 'mcp_action',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
    
})

