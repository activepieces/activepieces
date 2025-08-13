import {
    ApplicationEventName,
    ResetPasswordRequestBody,
    VerifyEmailRequestBody } from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { eventsHooks } from '../../../helper/application-events'
import { enterpriseLocalAuthnService } from './enterprise-local-authn-service'

export const enterpriseLocalAuthnController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/verify-email', VerifyEmailRequest, async (req) => {
        eventsHooks.get(req.log).sendUserEventFromRequest(req, {
            action: ApplicationEventName.USER_EMAIL_VERIFIED,
            data: {},
        })
        return enterpriseLocalAuthnService(req.log).verifyEmail(req.body)
    })

    app.post('/reset-password', ResetPasswordRequest, async (req) => {
        eventsHooks.get(req.log).sendUserEventFromRequest(req, {
            action: ApplicationEventName.USER_PASSWORD_RESET,
            data: {},
        })
        await enterpriseLocalAuthnService(req.log).resetPassword(req.body)
    })
}

const VerifyEmailRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: VerifyEmailRequestBody,
    },
}

const ResetPasswordRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: ResetPasswordRequestBody,
    },
}
