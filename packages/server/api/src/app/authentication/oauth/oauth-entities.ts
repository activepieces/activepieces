import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type OAuthClient = {
    id: string
    created: string
    updated: string
    clientId: string
    clientSecretHash: string | null
    clientName: string
    redirectUris: string[]
    grantTypes: string[]
    platformId: string
    platform: unknown
}

type OAuthAuthorizationCode = {
    id: string
    created: string
    updated: string
    code: string
    clientId: string
    userId: string
    platformId: string
    scopes: string[]
    codeChallenge: string
    codeChallengeMethod: string
    redirectUri: string
    resource: string | null
    expiresAt: Date
    used: boolean
}

type OAuthRefreshToken = {
    id: string
    created: string
    updated: string
    tokenHash: string
    clientId: string
    userId: string
    platformId: string
    scopes: string[]
    expiresAt: Date
    revoked: boolean
}

export const OAuthClientEntity = new EntitySchema<OAuthClient>({
    name: 'oauth_client',
    columns: {
        ...BaseColumnSchemaPart,
        clientId: {
            type: String,
            nullable: false,
        },
        clientSecretHash: {
            type: String,
            nullable: true,
        },
        clientName: {
            type: String,
            nullable: false,
        },
        redirectUris: {
            type: 'jsonb',
            nullable: false,
        },
        grantTypes: {
            type: 'jsonb',
            nullable: false,
        },
        platformId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_oauth_client_client_id',
            columns: ['clientId'],
            unique: true,
        },
        {
            name: 'idx_oauth_client_platform_id',
            columns: ['platformId'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
            },
        },
    },
})

export const OAuthAuthorizationCodeEntity = new EntitySchema<OAuthAuthorizationCode>({
    name: 'oauth_authorization_code',
    columns: {
        ...BaseColumnSchemaPart,
        code: {
            type: String,
            nullable: false,
        },
        clientId: {
            type: String,
            nullable: false,
        },
        userId: ApIdSchema,
        platformId: ApIdSchema,
        scopes: {
            type: 'jsonb',
            nullable: false,
        },
        codeChallenge: {
            type: String,
            nullable: false,
        },
        codeChallengeMethod: {
            type: String,
            nullable: false,
        },
        redirectUri: {
            type: String,
            nullable: false,
        },
        resource: {
            type: String,
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
            name: 'idx_oauth_authorization_code_code',
            columns: ['code'],
            unique: true,
        },
    ],
})

export const OAuthRefreshTokenEntity = new EntitySchema<OAuthRefreshToken>({
    name: 'oauth_refresh_token',
    columns: {
        ...BaseColumnSchemaPart,
        tokenHash: {
            type: String,
            nullable: false,
        },
        clientId: {
            type: String,
            nullable: false,
        },
        userId: ApIdSchema,
        platformId: ApIdSchema,
        scopes: {
            type: 'jsonb',
            nullable: false,
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
            name: 'idx_oauth_refresh_token_hash',
            columns: ['tokenHash'],
            unique: true,
        },
    ],
})
