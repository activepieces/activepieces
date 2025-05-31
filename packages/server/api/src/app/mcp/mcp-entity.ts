import { McpWithTools } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

export const McpEntity = new EntitySchema<McpWithTools>({
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
        tools: {
            type: 'one-to-many',
            target: 'mcp_tool',
            inverseSide: 'mcp',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
    
})

