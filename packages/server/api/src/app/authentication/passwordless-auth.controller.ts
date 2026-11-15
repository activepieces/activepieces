import { isNil } from '@activepieces/core-utils'
import { RequestEmailCodeRequest, SignUpMethod, TelemetryEventName, UserIdentityProvider, VerifyEmailCodeRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { authnRateLimit, emailCodeRateLimit } from '../core/security/rate-limit'
import { networkUtils } from '../helper/network-utils'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { telemetry } from '../helper/telemetry.utils'
import { platformUtils } from '../platform/platform.utils'
import { authenticationSideEffects } from './authentication-side-effects'
import { passwordlessAuthService } from './passwordless-auth.service'

export const passwordlessAuthController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post('/otp/request', RequestEmailCodeRequestOptions, async (request, reply) => {
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        await passwordlessAuthService(request.log).requestCode({
            email: request.body.email,
            platformId: platformId ?? null,
            captchaToken: request.body.captchaToken,
            remoteIp: networkUtils.clientIp(request),
        })
        return reply.code(StatusCodes.NO_CONTENT).send()
    })

    app.post('/otp/verify', VerifyEmailCodeRequestOptions, async (request) => {
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        const { response, signedUp } = await passwordlessAuthService(request.log).verifyCode({
            email: request.body.email,
            code: request.body.code,
            platformId: platformId ?? null,
        })

        if (signedUp && !isNil(response.platformId)) {
            rejectedPromiseHandler(telemetry(request.log).identifySignUp({
                userId: response.id,
                platformId: response.platformId,
                method: SignUpMethod.EMAIL_CODE,
                attribution: request.body.attribution,
            }), request.log)
        }

        authenticationSideEffects(request.log).onSignIn({
            response,
            signedUp,
            method: UserIdentityProvider.EMAIL,
            ip: networkUtils.clientIp(request),
        })
        if (!isNil(response.platformId)) {
            rejectedPromiseHandler(telemetry(request.log).trackUser({
                userId: response.id,
                platformId: response.platformId,
                event: {
                    name: TelemetryEventName.SIGNED_IN,
                    payload: {
                        userId: response.id,
                        platformId: response.platformId,
                    },
                },
            }), request.log)
        }

        return response
    })
}

const RequestEmailCodeRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: emailCodeRateLimit,
    },
    schema: {
        body: RequestEmailCodeRequest,
    },
}

const VerifyEmailCodeRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: authnRateLimit,
    },
    schema: {
        body: VerifyEmailCodeRequest,
    },
}
