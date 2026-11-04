import { isNil } from '@activepieces/core-utils'
import { ClaimTokenRequest, SignUpMethod, TelemetryEventName, ThirdPartyAuthnProviderEnum, UserIdentityProvider } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticationSideEffects } from '../../../authentication/authentication-side-effects'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { networkUtils } from '../../../helper/network-utils'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { telemetry } from '../../../helper/telemetry.utils'
import { platformUtils } from '../../../platform/platform.utils'
import { federatedAuthnService } from './federated-authn-service'

export const federatedAuthModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(federatedAuthnController, {
        prefix: '/v1/authn/federated',
    })
}

const federatedAuthnController: FastifyPluginAsyncZod = async (app) => {
    app.get('/login', LoginRequestSchema, async (req) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        return federatedAuthnService(req.log).login({
            platformId: platformId ?? undefined,
        })
    })

    app.post('/claim', ClaimTokenRequestSchema, async (req) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        const { response, signedUp } = await federatedAuthnService(req.log).claim({
            platformId: platformId ?? undefined,
            code: req.body.code,
        })
        authenticationSideEffects(req.log).onSignIn({
            response,
            signedUp,
            method: UserIdentityProvider.GOOGLE,
            ip: networkUtils.clientIp(req),
        })
        if (signedUp && !isNil(response.platformId)) {
            rejectedPromiseHandler(telemetry(req.log).identifySignUp({
                userId: response.id,
                platformId: response.platformId,
                method: SignUpMethod.GOOGLE,
                attribution: req.body.attribution,
            }), req.log)
        }
        else if (!isNil(response.platformId)) {
            rejectedPromiseHandler(telemetry(req.log).trackUser({
                userId: response.id,
                platformId: response.platformId,
                event: {
                    name: TelemetryEventName.SIGNED_IN,
                    payload: {
                        userId: response.id,
                        platformId: response.platformId,
                    },
                },
            }), req.log)
        }
        return response
    })
}

const LoginRequestSchema = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            providerName: z.nativeEnum(ThirdPartyAuthnProviderEnum),
        }),
    },
}

const ClaimTokenRequestSchema = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: ClaimTokenRequest,
    },
}
