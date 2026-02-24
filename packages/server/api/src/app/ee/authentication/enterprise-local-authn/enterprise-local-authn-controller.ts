import {
    ApplicationEventName,
    ResetPasswordRequestBody,
    VerifyEmailRequestBody } from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { applicationEvents } from '../../../helper/application-events'
import { enterpriseLocalAuthnService } from './enterprise-local-authn-service'

export const enterpriseLocalAuthnController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/verify-email', VerifyEmailRequest, async (req) => {
        applicationEvents.sendUserEvent(req, {
            action: ApplicationEventName.USER_EMAIL_VERIFIED,
            data: {},
        })
        await enterpriseLocalAuthnService(req.log).verifyEmail(req.body)
    })

    app.post('/reset-password', ResetPasswordRequest, async (req) => {
        applicationEvents.sendUserEvent(req, {
            action: ApplicationEventName.USER_PASSWORD_RESET,
            data: {},
        })
        await enterpriseLocalAuthnService(req.log).resetPassword(req.body)
    })
}

const VerifyEmailRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: VerifyEmailRequestBody,
    },
}

const ResetPasswordRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: ResetPasswordRequestBody,
    },
}
