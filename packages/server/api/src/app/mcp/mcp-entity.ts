import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'
import { MCPSchema } from '@activepieces/shared'




export const MCPEntity = new EntitySchema<MCPSchema>({
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
        connections: {
            type: 'one-to-many',
            target: 'app_connection',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
    
})

