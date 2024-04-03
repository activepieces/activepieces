import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { eventsHooks } from '../../../helper/application-events'
import { enterpriseLocalAuthnService } from './enterprise-local-authn-service'
import {
    ApplicationEventName,
    ResetPasswordRequestBody,
    VerifyEmailRequestBody } from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'

export const enterpriseLocalAuthnController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/verify-email', VerifyEmailRequest, async (req) => {
        eventsHooks.get().send(req, {
            action: ApplicationEventName.VERIFIED_EMAIL,
            userId: req.body.userId,
        })
        await enterpriseLocalAuthnService.verifyEmail(req.body)
    })

    app.post('/reset-password', ResetPasswordRequest, async (req) => {
        eventsHooks.get().send(req, {
            action: ApplicationEventName.RESET_PASSWORD,
            userId: req.body.userId,
        })
        await enterpriseLocalAuthnService.resetPassword(req.body)
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
