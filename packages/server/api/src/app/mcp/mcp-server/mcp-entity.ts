import { Agent, Flow, McpWithTools } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type McpWithToolsWithSchema = McpWithTools & {  
    agent: Agent
    flow: Flow
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
        flowId: {
            type: String,
            nullable: true,
        },
        stepName: {
            type: String,
            nullable: true,
        },
        externalId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'mcp_project_id_external_id',
            columns: ['projectId', 'externalId'],
            unique: true,
        },
        {
            name: 'mcp_agent_id',
            columns: ['agentId'],
            unique: false,
        },
        {
            name: 'mcp_flow_id_step_name',
            columns: ['flowId', 'stepName'],
            unique: true,
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
            type: 'many-to-one',
            target: 'agent',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'agentId',
                foreignKeyConstraintName: 'fk_mcp_agent_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
    
})

