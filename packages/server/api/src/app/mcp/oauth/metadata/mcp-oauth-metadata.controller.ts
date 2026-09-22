import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { domainHelper } from '../../../helper/domain-helper'
import { MCP_OAUTH_SUPPORTED_SCOPES } from '../mcp-oauth-scopes'
import { authorizationServerMetadata } from './mcp-oauth-metadata'

export const mcpOAuthMetadataController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/oauth-authorization-server', PublicMetadataRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send(authorizationServerMetadata({ issuer }))
    })

    for (const resourcePath of RESOURCE_PATHS) {
        app.get(`/.well-known/oauth-protected-resource/${resourcePath}`, PublicMetadataRequest, async (req, reply) => {
            const issuer = domainHelper.getPublicUrlFromRequest({ req })
            return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
                resource: `${issuer}/${resourcePath}`,
                authorization_servers: [issuer],
                scopes_supported: MCP_OAUTH_SUPPORTED_SCOPES,
            })
        })
    }
}

const RESOURCE_PATHS = ['mcp', 'mcp/platform']

const PublicMetadataRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
