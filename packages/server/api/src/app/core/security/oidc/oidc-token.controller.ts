import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { securityAccess } from '../authorization/fastify-security'
import { oidcKeyManager } from './oidc-key-manager'

const TOKEN_TTL_SECONDS = 3600

export const oidcTokenController: FastifyPluginAsyncZod = async (app) => {
    const issuer = system.getOrThrow(AppSystemProp.FRONTEND_URL).replace(/\/$/, '')
    app.get('/oidc-token', {
        config: { security: securityAccess.engine() },
        schema: { hide: true },
    }, async (request) => {
        const { projectId, platform } = request.principal
        const privateKey = await oidcKeyManager.getPrivateKeyPem()
        const token = await jwtUtils.sign({
            payload: {
                sub: `platform:${platform.id}:project:${projectId}`,
                aud: 'sts.amazonaws.com',
            },
            key: privateKey,
            expiresInSeconds: TOKEN_TTL_SECONDS,
            algorithm: JwtSignAlgorithm.RS256,
            keyId: oidcKeyManager.kid,
            issuer,
        })
        return { token }
    })
}
