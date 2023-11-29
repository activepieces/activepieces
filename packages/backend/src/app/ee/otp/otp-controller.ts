import { CreateOtpRequestBody } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { otpService } from './otp-service'
import { resolvePlatformIdForRequest } from '../platform/lib/platform-utils'
import { StatusCodes } from 'http-status-codes'


export const otpController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOtpRequest, async (req, res) => {
        const platformId = await resolvePlatformIdForRequest(req)
        await otpService.createAndSend({
            platformId,
            ...req.body,
        })
        return res.code(StatusCodes.NO_CONTENT).send()
    })
}

const CreateOtpRequest = {
    schema: {
        body: CreateOtpRequestBody,
    },
}
