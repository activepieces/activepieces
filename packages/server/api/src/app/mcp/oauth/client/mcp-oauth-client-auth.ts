import { isNil } from '@activepieces/core-utils'
import { McpOAuthClient, tryCatchSync } from '@activepieces/shared'
import { mcpOAuthClientService } from './mcp-oauth-client.service'

function decodeCredentialPart(value: string): string {
    const result = tryCatchSync(() => decodeURIComponent(value))
    return result.error ? value : result.data
}

function parseBasicPayload(encoded: string): BasicCredentials | null {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')
    if (separatorIndex === -1) {
        return null
    }
    return {
        clientId: decodeCredentialPart(decoded.slice(0, separatorIndex)),
        clientSecret: decodeCredentialPart(decoded.slice(separatorIndex + 1)),
    }
}

export const mcpOAuthClientAuth = {
    async authenticate({ authorizationHeader, clientId: bodyClientId, clientSecret: bodyClientSecret }: AuthenticateParams): Promise<AuthenticateResult> {
        const [scheme, encoded] = authorizationHeader?.split(' ') ?? []
        const basicHeaderPresent = scheme?.toLowerCase() === 'basic'

        if (basicHeaderPresent && !isNil(bodyClientSecret)) {
            return { status: 'error', error: 'invalid_request', errorDescription: 'Multiple client authentication mechanisms' }
        }

        const basic = basicHeaderPresent && encoded ? parseBasicPayload(encoded) : null
        const clientId = basic?.clientId ?? bodyClientId
        if (!clientId) {
            return { status: 'anonymous' }
        }

        const client = await mcpOAuthClientService.getByClientId(clientId)
        if (isNil(client)) {
            return { status: 'error', error: 'invalid_client' }
        }

        if (client.tokenEndpointAuthMethod === 'client_secret_post') {
            if (!bodyClientSecret || !mcpOAuthClientService.validateClientSecret(client, bodyClientSecret)) {
                return { status: 'error', error: 'invalid_client', errorDescription: 'Invalid client secret' }
            }
        }
        else if (client.tokenEndpointAuthMethod === 'client_secret_basic') {
            if (!basic?.clientSecret || !mcpOAuthClientService.validateClientSecret(client, basic.clientSecret)) {
                return { status: 'error', error: 'invalid_client', errorDescription: 'Invalid client secret' }
            }
        }

        return { status: 'authenticated', client }
    },
}

type AuthenticateParams = {
    authorizationHeader: string | undefined
    clientId?: string
    clientSecret?: string
}

type BasicCredentials = {
    clientId: string
    clientSecret: string
}

type AuthenticateResult =
    | { status: 'authenticated', client: McpOAuthClient }
    | { status: 'anonymous' }
    | { status: 'error', error: string, errorDescription?: string }
