import { CreateOtpRequestBody, OtpModel, OtpResponse } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { otpService } from './otp-service'
import { resolvePlatformIdForRequest } from '../platform/lib/platform-utils'

export const otpController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOtpRequest, async (req) => {
        const platformId = await resolvePlatformIdForRequest(req)

        const otp = await otpService.createAndSend({
            platformId,
            ...req.body,
        })

        return toOtpResponse(otp)
    })
}

const toOtpResponse = (otp: OtpModel): OtpResponse => {
    const { value: _, ...otpResponse } = otp
    return otpResponse
}

const CreateOtpRequest = {
    schema: {
        body: CreateOtpRequestBody,
        response: {
            200: OtpResponse,
        },
    },
}
