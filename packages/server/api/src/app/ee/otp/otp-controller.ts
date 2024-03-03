import { CreateOtpRequestBody } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { otpService } from './otp-service'
import { resolvePlatformIdForRequest } from '../../platform/platform-utils'
import { StatusCodes } from 'http-status-codes'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined } from '@activepieces/shared'

export const otpController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOtpRequest, async (req, res) => {
        const platformId = await resolvePlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'platformId')
        await otpService.createAndSend({
            platformId,
            ...req.body,
        })
        return res.code(StatusCodes.NO_CONTENT).send()
    })
}

const CreateOtpRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: CreateOtpRequestBody,
    },
}
