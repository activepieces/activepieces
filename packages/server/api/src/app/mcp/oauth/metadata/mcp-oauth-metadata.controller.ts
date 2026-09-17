import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { domainHelper } from '../../../helper/domain-helper'

export const mcpOAuthMetadataController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/oauth-authorization-server', PublicMetadataRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            registration_endpoint: `${issuer}/register`,
            revocation_endpoint: `${issuer}/revoke`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            code_challenge_methods_supported: ['S256'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
            revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
            scopes_supported: ['mcp', 'openid', 'email', 'profile'],
            userinfo_endpoint: `${issuer}/userinfo`,
        })
    })

    app.get('/.well-known/oauth-protected-resource/mcp', PublicMetadataRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            resource: `${issuer}/mcp`,
            authorization_servers: [issuer],
            scopes_supported: ['mcp', 'openid', 'email', 'profile'],
        })
    })

    app.get('/.well-known/oauth-protected-resource/mcp/platform', PublicMetadataRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            resource: `${issuer}/mcp/platform`,
            authorization_servers: [issuer],
            scopes_supported: ['mcp', 'openid', 'email', 'profile'],
        })
    })
}

const PublicMetadataRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
