import { isNil } from '@activepieces/core-utils'
import { McpOAuthClient, tryCatchSync } from '@activepieces/shared'
import { mcpOAuthClientService } from './mcp-oauth-client.service'

function decodeCredentialPart(value: string): string {
    const result = tryCatchSync(() => decodeURIComponent(value))
    return result.error ? value : result.data
}

function parseBasicHeader(authorizationHeader: string | undefined): BasicCredentials | null {
    const [scheme, encoded] = authorizationHeader?.split(' ') ?? []
    if (scheme?.toLowerCase() !== 'basic' || isNil(encoded)) {
        return null
    }
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
        const basic = parseBasicHeader(authorizationHeader)

        if (basic && bodyClientId && basic.clientId !== bodyClientId) {
            return { status: 'error', error: 'invalid_request', errorDescription: 'client_id mismatch between Authorization header and request body' }
        }

        const clientId = basic?.clientId ?? bodyClientId
        if (!clientId) {
            return { status: 'anonymous' }
        }

        const client = await mcpOAuthClientService.getByClientId(clientId)
        if (isNil(client)) {
            return { status: 'error', error: 'invalid_client' }
        }

        if (client.tokenEndpointAuthMethod !== 'none') {
            const presentedSecret = basic?.clientSecret || bodyClientSecret
            if (!presentedSecret || !mcpOAuthClientService.validateClientSecret(client, presentedSecret)) {
                return { status: 'error', error: 'invalid_client', errorDescription: 'Invalid client secret' }
            }
        }

        return { status: 'authenticated', client }
    },

    toErrorPayload({ error, errorDescription }: AuthenticateError): Record<string, string> {
        return errorDescription ? { error, error_description: errorDescription } : { error }
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

type AuthenticateError = {
    status: 'error'
    error: string
    errorDescription?: string
}

type AuthenticateResult =
    | { status: 'authenticated', client: McpOAuthClient }
    | { status: 'anonymous' }
    | AuthenticateError
