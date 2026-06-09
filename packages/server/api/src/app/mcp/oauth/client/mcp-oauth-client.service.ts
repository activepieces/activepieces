import { randomBytes } from 'crypto'
import { cryptoUtils } from '@activepieces/server-utils'
import { apId, McpOAuthClient } from '@activepieces/shared'
import { repoFactory } from '../../../core/db/repo-factory'
import { McpOAuthClientEntity } from './mcp-oauth-client.entity'

const repo = repoFactory(McpOAuthClientEntity)

function hashSecret(secret: string): string {
    return cryptoUtils.hashSHA256(secret)
}

function generateClientId(): string {
    return randomBytes(24).toString('base64url')
}

function generateClientSecret(): string {
    return randomBytes(32).toString('base64url')
}

export const mcpOAuthClientService = {
    async getByClientId(clientId: string): Promise<McpOAuthClient | null> {
        return repo().findOneBy({ clientId })
    },

    async register(params: RegisterClientParams): Promise<RegisterClientResult> {
        const clientId = generateClientId()
        const isPublicClient = params.tokenEndpointAuthMethod === 'none'
        const rawSecret = isPublicClient ? null : generateClientSecret()
        const hashedSecret = rawSecret ? hashSecret(rawSecret) : null

        const clientSecretExpiresAt = 0
        const clientIdIssuedAt = Math.floor(Date.now() / 1000)

        const client: McpOAuthClient = {
            id: apId(),
            clientId,
            clientSecret: hashedSecret,
            clientSecretExpiresAt,
            clientIdIssuedAt,
            redirectUris: params.redirectUris,
            clientName: params.clientName ?? null,
            grantTypes: params.grantTypes ?? ['authorization_code', 'refresh_token'],
            tokenEndpointAuthMethod: params.tokenEndpointAuthMethod ?? 'none',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        }

        await repo().save(client)

        return {
            client_id: clientId,
            client_secret: rawSecret ?? undefined,
            client_id_issued_at: clientIdIssuedAt,
            client_secret_expires_at: clientSecretExpiresAt,
            redirect_uris: client.redirectUris,
            client_name: client.clientName ?? undefined,
            grant_types: client.grantTypes,
            token_endpoint_auth_method: client.tokenEndpointAuthMethod,
        }
    },

    validateClientSecret(client: McpOAuthClient, secret: string): boolean {
        if (!client.clientSecret) {
            return false
        }
        return client.clientSecret === hashSecret(secret)
    },

    validateRedirectUri(client: McpOAuthClient, redirectUri: string): boolean {
        return client.redirectUris.includes(redirectUri)
    },
}

type RegisterClientParams = {
    redirectUris: string[]
    clientName?: string
    grantTypes?: string[]
    tokenEndpointAuthMethod?: string
}

type RegisterClientResult = {
    client_id: string
    client_secret?: string
    client_id_issued_at: number
    client_secret_expires_at: number
    redirect_uris: string[]
    client_name?: string
    grant_types: string[]
    token_endpoint_auth_method: string
}
