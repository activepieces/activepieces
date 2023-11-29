import { CreateOtpRequestBody } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { otpService } from './otp-service'
import { resolvePlatformIdForRequest } from '../platform/lib/platform-utils'

export const otpController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOtpRequest, async (req) => {
        const platformId = await resolvePlatformIdForRequest(req)
        await otpService.createAndSend({
            platformId,
            ...req.body,
        })

    })
}

const CreateOtpRequest = {
    schema: {
        body: CreateOtpRequestBody,
    },
}
