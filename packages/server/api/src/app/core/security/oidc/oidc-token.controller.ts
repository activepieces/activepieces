import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { domainHelper } from '../../../helper/domain-helper'
import { securityAccess } from '../authorization/fastify-security'
import { oidcKeyManager } from './oidc-key-manager'

export const oidcTokenController: FastifyPluginAsyncZod = async (app) => {
    app.post('/oidc-token', CreateOidcTokenRequestOptions, async (request, reply) => {
        const { projectId, platform } = request.principal
        const { audience, expiresInSeconds } = request.body
        const token = await oidcKeyManager.sign({
            payload: {
                sub: `platform:${platform.id}:project:${projectId}`,
                aud: audience,
            },
            expiresInSeconds,
            issuer: domainHelper.getConfiguredPublicUrl(),
        })
        void reply.header('Cache-Control', 'no-store')
        void reply.header('Pragma', 'no-cache')
        return { token }
    })
}

const DEFAULT_TOKEN_TTL_SECONDS = 3600
const MIN_TOKEN_TTL_SECONDS = 60
const MAX_TOKEN_TTL_SECONDS = 3600

const CreateOidcTokenRequest = z.object({
    audience: z.string().trim().min(1),
    expiresInSeconds: z.number().int().min(MIN_TOKEN_TTL_SECONDS).max(MAX_TOKEN_TTL_SECONDS).default(DEFAULT_TOKEN_TTL_SECONDS),
})

const CreateOidcTokenRequestOptions = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        hide: true,
        body: CreateOidcTokenRequest,
    },
}
