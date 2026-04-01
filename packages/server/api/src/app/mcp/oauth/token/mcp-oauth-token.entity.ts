import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export type McpOAuthToken = {
    id: string
    refreshToken: string
    clientId: string
    userId: string
    projectId: string
    platformId: string
    scopes: string[] | null
    expiresAt: string
    revoked: boolean
    created: string
    updated: string
}

export const McpOAuthTokenEntity = new EntitySchema<McpOAuthToken>({
    name: 'mcp_oauth_token',
    columns: {
        ...BaseColumnSchemaPart,
        refreshToken: {
            type: String,
            length: 128,
            nullable: false,
        },
        clientId: {
            type: String,
            length: 64,
            nullable: false,
        },
        userId: ApIdSchema,
        projectId: ApIdSchema,
        platformId: ApIdSchema,
        scopes: {
            type: String,
            array: true,
            nullable: true,
        },
        expiresAt: {
            type: 'timestamp with time zone',
            nullable: false,
        },
        revoked: {
            type: Boolean,
            nullable: false,
            default: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_oauth_token_refresh',
            columns: ['refreshToken'],
            unique: true,
        },
    ],
})
