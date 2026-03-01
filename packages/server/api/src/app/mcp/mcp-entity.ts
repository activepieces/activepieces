import { McpServer, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type McpServerWithSchema = McpServer & {  
    project: Project
}

export const McpServerEntity = new EntitySchema<McpServerWithSchema>({
    name: 'mcp_server',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        status: {
            type: String,
            nullable: false,
        },
        token: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'mcp_server_project_id',
            columns: ['projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
            },
        },
    },
    
})

