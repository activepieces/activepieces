import { Agent, McpWithTools } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type McpWithToolsWithSchema = McpWithTools & {  
    agent: Agent
}
export const McpEntity = new EntitySchema<McpWithToolsWithSchema>({
    name: 'mcp',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },  
        agentId: {
            type: String,
            nullable: true,
        },
        projectId: ApIdSchema,
        token: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'mcp_project_id',
            columns: ['projectId'],
            unique: false,
        },
        {
            name: 'mcp_agent_id',
            columns: ['agentId'],
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
        agent: {
            type: 'one-to-one',
            target: 'agent',
            inverseSide: 'mcp',
            onDelete: 'CASCADE',
        },
    },
    
})

