import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { securityAccess } from '../authorization/fastify-security'
import { oidcKeyManager } from './oidc-key-manager'

export const oidcDiscoveryController: FastifyPluginAsyncZod = async (app) => {
    app.get('/.well-known/openid-configuration', {
        config: { security: securityAccess.public() },
        schema: { hide: true },
    }, async (_req, reply) => {
        const issuer = resolveIssuer()
        return reply.status(200).header('Access-Control-Allow-Origin', '*').send({
            issuer,
            jwks_uri: `${issuer}/.well-known/jwks.json`,
            response_types_supported: ['id_token'],
            id_token_signing_alg_values_supported: ['RS256'],
            subject_types_supported: ['public'],
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

function resolveIssuer(): string {
    const explicit = system.get(AppSystemProp.OIDC_ISSUER_URL)
    if (explicit) {
        return explicit.replace(/\/$/, '')
    }
    return system.getOrThrow(AppSystemProp.FRONTEND_URL).replace(/\/$/, '')
}
