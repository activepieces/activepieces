import { Mcp, McpTool } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'


type McpSchema = Mcp & {
    tools: McpTool[]
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
        tools: {
            type: 'one-to-many',
            target: 'mcp_tool',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
    
})

