import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { domainHelper } from '../../../helper/domain-helper'
import { authorizationServerMetadata } from '../../../mcp/oauth/metadata/mcp-oauth-metadata'
import { securityAccess } from '../authorization/fastify-security'
import { oidcKeyManager } from './oidc-key-manager'

export const oidcDiscoveryController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/openid-configuration', PublicDiscoveryRequest, async (req, reply) => {
        const issuer = domainHelper.getPublicUrlFromRequest({ req })
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            ...authorizationServerMetadata({ issuer }),
            jwks_uri: `${issuer}/.well-known/jwks.json`,
            id_token_signing_alg_values_supported: ['RS256'],
            subject_types_supported: ['public'],
            claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'email_verified', 'name', 'given_name', 'family_name'],
        })
    })

    app.get('/.well-known/jwks.json', PublicDiscoveryRequest, async (_req, reply) => {
        const jwk = await oidcKeyManager.getPublicKeyJwk()
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            keys: [jwk],
        })
    })
}

const PublicDiscoveryRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
