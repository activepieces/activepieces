import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../../database/database-common'

export type McpOAuthClient = {
    id: string
    clientId: string
    clientSecret: string | null
    clientSecretExpiresAt: number
    clientIdIssuedAt: number
    redirectUris: string[]
    clientName: string | null
    grantTypes: string[]
    tokenEndpointAuthMethod: string
    created: string
    updated: string
}

export const McpOAuthClientEntity = new EntitySchema<McpOAuthClient>({
    name: 'mcp_oauth_client',
    columns: {
        ...BaseColumnSchemaPart,
        clientId: {
            type: String,
            length: 64,
            nullable: false,
        },
        clientSecret: {
            type: String,
            length: 128,
            nullable: true,
        },
        clientSecretExpiresAt: {
            type: 'bigint',
            nullable: false,
            default: 0,
        },
        clientIdIssuedAt: {
            type: 'bigint',
            nullable: false,
        },
        redirectUris: {
            type: String,
            array: true,
            nullable: false,
        },
        clientName: {
            type: String,
            length: 255,
            nullable: true,
        },
        grantTypes: {
            type: String,
            array: true,
            nullable: false,
        },
        tokenEndpointAuthMethod: {
            type: String,
            length: 64,
            nullable: false,
            default: '\'none\'',
        },
    },
    indices: [
        {
            name: 'idx_mcp_oauth_client_client_id',
            columns: ['clientId'],
            unique: true,
        },
    ],
})
