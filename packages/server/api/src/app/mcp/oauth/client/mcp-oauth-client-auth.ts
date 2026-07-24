import { McpOAuthClient, tryCatchSync } from '@activepieces/shared'

function decodeCredentialPart(value: string): string {
    const result = tryCatchSync(() => decodeURIComponent(value))
    return result.error ? value : result.data
}

export const mcpOAuthClientAuth = {
    extractCredentials({ authorizationHeader, clientId, clientSecret }: ExtractCredentialsParams): ClientCredentials {
        const [scheme, encoded] = authorizationHeader?.split(' ') ?? []
        if (scheme?.toLowerCase() === 'basic' && encoded) {
            const decoded = Buffer.from(encoded, 'base64').toString('utf8')
            const separatorIndex = decoded.indexOf(':')
            if (separatorIndex !== -1) {
                return {
                    clientId: decodeCredentialPart(decoded.slice(0, separatorIndex)),
                    clientSecret: decodeCredentialPart(decoded.slice(separatorIndex + 1)),
                }
            }
        }
        return { clientId, clientSecret }
    },
    requiresClientSecret(client: McpOAuthClient): boolean {
        return client.tokenEndpointAuthMethod === 'client_secret_post' || client.tokenEndpointAuthMethod === 'client_secret_basic'
    },
}

type ExtractCredentialsParams = {
    authorizationHeader: string | undefined
    clientId?: string
    clientSecret?: string
}

type ClientCredentials = {
    clientId?: string
    clientSecret?: string
}
