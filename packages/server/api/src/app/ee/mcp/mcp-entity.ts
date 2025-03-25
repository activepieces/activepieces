import { MCP, MCPStatus } from '@activepieces/ee-shared'
import { AppConnection } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'



type MCPSchema = MCP & {
    connections: AppConnection[]
}

export const MCPEntity = new EntitySchema<MCPSchema>({
    name: 'mcp',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        status: {
            type: String,
            nullable: false,
            enum: MCPStatus,
            default: MCPStatus.DISABLED,
        },
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
            type: 'many-to-many',
            target: 'app_connection',
            cascade: true,
            onDelete: 'CASCADE',
            joinTable: {
                name: 'mcp_connection',
                joinColumn: {
                    name: 'mcpId',
                    referencedColumnName: 'id',
                },
                inverseJoinColumn: {
                    name: 'connectionId',
                    referencedColumnName: 'id',
                },
            },
        },
    },
    
})

