import { MCP_OAUTH_SUPPORTED_SCOPES } from '../mcp-oauth-scopes'

export function authorizationServerMetadata({ issuer }: { issuer: string }): AuthorizationServerMetadata {
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

export type AuthorizationServerMetadata = {
    issuer: string
    authorization_endpoint: string
    token_endpoint: string
    userinfo_endpoint: string
    registration_endpoint: string
    revocation_endpoint: string
    response_types_supported: string[]
    grant_types_supported: string[]
    code_challenge_methods_supported: string[]
    token_endpoint_auth_methods_supported: string[]
    revocation_endpoint_auth_methods_supported: string[]
    scopes_supported: string[]
}
