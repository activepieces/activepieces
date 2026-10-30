import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { domainHelper } from '../../../helper/domain-helper'
import { authorizationServerMetadata, protectedResourceMetadata } from './mcp-oauth-metadata'

export const mcpOAuthMetadataController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/oauth-authorization-server', PublicMetadataRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send(authorizationServerMetadata({ issuer }))
    })

    app.get('/.well-known/oauth-protected-resource', PublicMetadataRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        const requestedResource = (req.query as { resource?: string } | undefined)?.resource
        const resourcePath = resolveResourcePath(requestedResource)
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send(protectedResourceMetadata({ issuer, resourcePath }))
    })

    for (const resourcePath of RESOURCE_PATHS) {
        app.get(`/.well-known/oauth-protected-resource/${resourcePath}`, PublicMetadataRequest, async (req, reply) => {
            const issuer = domainHelper.getPublicUrlFromRequest({ req })
            return reply.status(200).header('Access-Control-Allow-Origin', '*').send(protectedResourceMetadata({ issuer, resourcePath }))
        })
    }
}

function resolveResourcePath(requestedResource?: string): string {
    if (requestedResource?.endsWith('/mcp/platform') || requestedResource?.includes('/platform')) {
        return 'mcp/platform'
    }
    return 'mcp'
}

const RESOURCE_PATHS = ['mcp', 'mcp/platform']

const PublicMetadataRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
