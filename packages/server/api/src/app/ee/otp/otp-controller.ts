import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { resolvePlatformIdForAuthnRequest } from '../../platform/platform-utils'
import { otpService } from './otp-service'
import { CreateOtpRequestBody } from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined } from '@activepieces/shared'

export const otpController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateOtpRequest, async (req, res) => {
        const platformId = await resolvePlatformIdForAuthnRequest(req.body.email, req)
        assertNotNullOrUndefined(platformId, 'platformId')
        await otpService.createAndSend({
            platformId,
            email: req.body.email,
            type: req.body.type,
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
