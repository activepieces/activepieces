import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthTokenService } from '../token/mcp-oauth-token.service'

export const mcpOAuthMetadataController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/oauth-authorization-server', AuthorizationServerMetadataRequest, async (_req, reply) => {
        const issuer = mcpOAuthTokenService.getIssuerUrl()
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            registration_endpoint: `${issuer}/register`,
            revocation_endpoint: `${issuer}/revoke`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            code_challenge_methods_supported: ['S256'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
            scopes_supported: ['mcp'],
        })
    })

    app.get('/.well-known/oauth-protected-resource/mcp', ProtectedResourceMetadataRequest, async (_req, reply) => {
        const issuer = mcpOAuthTokenService.getIssuerUrl()
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            resource: `${issuer}/mcp`,
            authorization_servers: [issuer],
        })
    })
}

const AuthorizationServerMetadataRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}

const ProtectedResourceMetadataRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
