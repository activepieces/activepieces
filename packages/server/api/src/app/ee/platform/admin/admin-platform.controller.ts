import { StripePlanName } from '@activepieces/ee-shared'
import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, GiftTrialByEmailRequestBody, isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { stripeHelper } from '../platform-plan/stripe-helper'
import { adminPlatformService } from './admin-platform.service'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/apply-license-key', ApplyLicenseKeyByEmailRequest, async (req, res) => {
        await adminPlatformService(req.log).applyLicenseKeyByEmail(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/gift-trials', GiftTrialByEmailRequest, async (req, res) => {
        const { gifts } = req.body
        const results = await Promise.all(
            gifts.map(gift => stripeHelper(req.log).giftTrialForCustomer({ email: gift.email, trialPeriod: gift.trialPeriod, plan: gift.trialPlan as StripePlanName })),
        )
        
        const errors = results.filter(result => !isNil(result))
        if (errors.length === 0) {
            return res.status(StatusCodes.OK).send({ message: 'All gifts processed successfully' })
        }

        return res.status(StatusCodes.PARTIAL_CONTENT).send({ errors })
    })
}

const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const ApplyLicenseKeyByEmailRequest = {
    schema: {
        body: ApplyLicenseKeyByEmailRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const GiftTrialByEmailRequest = {
    schema: {
        body: GiftTrialByEmailRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}