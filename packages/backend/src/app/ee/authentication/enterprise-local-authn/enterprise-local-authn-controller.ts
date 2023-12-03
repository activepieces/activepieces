import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { enterpriseLocalAuthnService } from './enterprise-local-authn-service'
import { ResetPasswordRequestBody, SignUpAndAcceptRequestBody, VerifyEmailRequestBody } from '@activepieces/ee-shared'

export const enterpriseLocalAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/verify-email', VerifyEmailRequest, async (req) => {
        await enterpriseLocalAuthnService.verifyEmail(req.body)
    })

    app.post('/reset-password', ResetPasswordRequest, async (req) => {
        await enterpriseLocalAuthnService.resetPassword(req.body)
    })

    app.post('/sign-up-and-accept', SignUpAndAcceptRequest, async (request) => {
        return enterpriseLocalAuthnService.signUpAndAcceptInvitation(request.body)
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

const SignUpAndAcceptRequest = {
    schema: {
        body: SignUpAndAcceptRequestBody,
    },
}
