import { MCP_OAUTH_SUPPORTED_SCOPES } from '../mcp-oauth-scopes'

export function authorizationServerMetadata({ issuer }: { issuer: string }): Record<string, unknown> {
    return {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        registration_endpoint: `${issuer}/register`,
        revocation_endpoint: `${issuer}/revoke`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: CLIENT_AUTH_METHODS,
        revocation_endpoint_auth_methods_supported: CLIENT_AUTH_METHODS,
        scopes_supported: MCP_OAUTH_SUPPORTED_SCOPES,
    }
}

const CLIENT_AUTH_METHODS = ['client_secret_post', 'client_secret_basic', 'none']
