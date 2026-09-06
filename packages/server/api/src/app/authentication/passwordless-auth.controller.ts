import { isNil } from '@activepieces/core-utils'
import { ApplicationEventName, RequestEmailCodeRequest, TelemetryEventName, VerifyEmailCodeRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { authnRateLimit, emailCodeRateLimit } from '../core/security/rate-limit'
import { applicationEvents } from '../helper/application-events'
import { networkUtils } from '../helper/network-utils'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { telemetry } from '../helper/telemetry.utils'
import { platformUtils } from '../platform/platform.utils'
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
        const response = await passwordlessAuthService(request.log).verifyCode({
            email: request.body.email,
            code: request.body.code,
            platformId: platformId ?? null,
        })

        if (!isNil(response.platformId)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: response.platformId,
                userId: response.id,
                projectId: response.projectId ?? undefined,
                ip: networkUtils.clientIp(request),
            }, {
                action: ApplicationEventName.USER_SIGNED_IN,
                data: {},
            })
            rejectedPromiseHandler(telemetry(request.log).trackUser(response.id, {
                name: TelemetryEventName.SIGNED_IN,
                payload: {
                    userId: response.id,
                    platformId: response.platformId,
                },
            }, { platform: response.platformId }), request.log)
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
