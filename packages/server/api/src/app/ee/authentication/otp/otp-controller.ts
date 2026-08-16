import { CreateOtpRequestBody } from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformUtils } from '../../../platform/platform.utils'
import { otpService } from './otp-service'

export const otpController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateOtpRequest, async (req, res) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        await otpService(req.log).createAndSend({
            platformId,
            email: req.body.email,
            type: req.body.type,
        })
        return res.code(StatusCodes.NO_CONTENT).send()
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const CreateOtpRequest = {
    config: {
        security: securityAccess.public(),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: CreateOtpRequestBody,
    },
}
