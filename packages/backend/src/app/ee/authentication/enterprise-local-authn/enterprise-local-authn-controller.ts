import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { enterpriseLocalAuthnService } from './enterprise-local-authn-service'
import { ResetPasswordRequestBody, VerifyEmailRequestBody } from '@activepieces/ee-shared'

export const enterpriseLocalAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/verify-email', VerifyEmailRequest, async (req) => {
        await enterpriseLocalAuthnService.verifyEmail({
            userId: req.principal.id,
            otp: req.body.otp,
        })
    })

    app.post('/reset-password', ResetPasswordRequest, async (req) => {
        await enterpriseLocalAuthnService.resetPassword(req.body)
    })
}

const VerifyEmailRequest = {
    schema: {
        body: VerifyEmailRequestBody,
    },
}

const ResetPasswordRequest = {
    schema: {
        body: ResetPasswordRequestBody,
    },
}
