import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { domainHelper } from '../../../helper/domain-helper'
import { MCP_OAUTH_SUPPORTED_SCOPES } from '../../../mcp/oauth/mcp-oauth-scopes'
import { securityAccess } from '../authorization/fastify-security'
import { oidcKeyManager } from './oidc-key-manager'

export const oidcDiscoveryController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/openid-configuration', {
        config: { security: securityAccess.public() },
        schema: { hide: true },
    }, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            issuer,
            jwks_uri: `${issuer}/.well-known/jwks.json`,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            userinfo_endpoint: `${issuer}/userinfo`,
            registration_endpoint: `${issuer}/register`,
            revocation_endpoint: `${issuer}/revoke`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            id_token_signing_alg_values_supported: ['RS256'],
            subject_types_supported: ['public'],
            scopes_supported: MCP_OAUTH_SUPPORTED_SCOPES,
            claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'email_verified', 'name', 'given_name', 'family_name'],
            code_challenge_methods_supported: ['S256'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
            revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        })
    })

    app.get('/.well-known/jwks.json', {
        config: { security: securityAccess.public() },
        schema: { hide: true },
    }, async (_req, reply) => {
        const jwk = await oidcKeyManager.getPublicKeyJwk()
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            keys: [jwk],
        })
    })
}
