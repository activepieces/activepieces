import { isNil, spreadIfDefined, tryCatchSync } from '@activepieces/core-utils'
import { McpOAuthClient } from '@activepieces/shared'
import { mcpOAuthClientService } from './mcp-oauth-client.service'

function decodeCredentialPart(value: string): string {
    const result = tryCatchSync(() => decodeURIComponent(value))
    return result.error ? value : result.data
}

function usesBasicScheme(authorizationHeader: string | undefined): boolean {
    const [scheme] = authorizationHeader?.split(' ') ?? []
    return scheme?.toLowerCase() === 'basic'
}

function parseBasicHeader(authorizationHeader: string | undefined): BasicCredentials | null {
    const [, encoded] = authorizationHeader?.split(' ') ?? []
    if (!usesBasicScheme(authorizationHeader) || isNil(encoded)) {
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

function invalidClient(errorDescription?: string): AuthenticateResult {
    return {
        status: 'error',
        payload: { error: 'invalid_client', ...spreadIfDefined('error_description', errorDescription) },
    }
}

export const mcpOAuthClientAuth = {
    async authenticate({ authorizationHeader, clientId: bodyClientId, clientSecret: bodyClientSecret }: AuthenticateParams): Promise<AuthenticateResult> {
        if (usesBasicScheme(authorizationHeader) && !isNil(bodyClientSecret)) {
            return {
                status: 'error',
                payload: { error: 'invalid_request', error_description: 'Multiple client authentication mechanisms' },
            }
        }

        const basic = parseBasicHeader(authorizationHeader)

        if (!isNil(basic) && bodyClientId && basic.clientId !== bodyClientId) {
            return {
                status: 'error',
                payload: { error: 'invalid_request', error_description: 'client_id mismatch between Authorization header and request body' },
            }
        }

        const clientId = basic?.clientId ?? bodyClientId
        if (!clientId) {
            return { status: 'anonymous' }
        }

        const client = await mcpOAuthClientService.getByClientId(clientId)
        if (isNil(client)) {
            return invalidClient()
        }

        if (client.tokenEndpointAuthMethod !== 'none') {
            const presentedSecret = basic?.clientSecret || bodyClientSecret
            if (!presentedSecret || !mcpOAuthClientService.validateClientSecret(client, presentedSecret)) {
                return invalidClient('Invalid client secret')
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
    | { status: 'error', payload: Record<string, string> }
