import { McpOAuthAuthorizationCode } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export const McpOAuthAuthorizationCodeEntity = new EntitySchema<McpOAuthAuthorizationCode>({
    name: 'mcp_oauth_authorization_code',
    columns: {
        ...BaseColumnSchemaPart,
        code: {
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
        redirectUri: {
            type: String,
            length: 2048,
            nullable: false,
        },
        codeChallenge: {
            type: String,
            length: 256,
            nullable: false,
        },
        codeChallengeMethod: {
            type: String,
            length: 8,
            nullable: false,
            default: 'S256',
        },
        scopes: {
            type: String,
            array: true,
            nullable: true,
        },
        state: {
            type: String,
            length: 512,
            nullable: true,
        },
        expiresAt: {
            type: 'timestamp with time zone',
            nullable: false,
        },
        used: {
            type: Boolean,
            nullable: false,
            default: false,
        },
    },
    indices: [
        {
            name: 'idx_mcp_oauth_code',
            columns: ['code'],
            unique: true,
        },
    ],
})
