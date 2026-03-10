import { McpServer, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type McpServerWithSchema = McpServer & {
    user: User
}

export const McpServerEntity = new EntitySchema<McpServerWithSchema>({
    name: 'mcp_server',
    columns: {
        ...BaseColumnSchemaPart,
        userId: ApIdSchema,
        status: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'mcp_server_user_id',
            columns: ['userId'],
            unique: true,
        },
    ],
    relations: {
        user: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                referencedColumnName: 'id',
            },
        },
    },

})

