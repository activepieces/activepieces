import { Flow, McpWithTools } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type McpWithToolsWithSchema = McpWithTools & {  
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
        projectId: ApIdSchema,
        token: {
            type: String,
            nullable: false,
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

