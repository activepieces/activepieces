import { FastifyRequest } from 'fastify'
import { plansService } from './plans/plan.service'
import { StatusCodes } from 'http-status-codes'
import { captureException, logger } from '../../helper/logger'
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { stripeHelper } from './stripe/stripe-helper'
import { usageService } from './usage/usage-service'
import { defaultPlanInformation, pricingPlans } from './plans/pricing-plans'
import { billingService } from './billing.service'

export const billingModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(billingController, { prefix: '/v1/billing' })
}

const UpgradeRequest = Type.Object({
    priceId: Type.String(),
})
type UpgradeRequest = Static<typeof UpgradeRequest>

const billingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/',
        async (
            request,
        ) => {
            return {
                plans: pricingPlans,
                defaultPlan: defaultPlanInformation,
                usage: await usageService.getUsage({ projectId: request.principal.projectId }),
                plan: await plansService.getOrCreateDefaultPlan({ projectId: request.principal.projectId }),
                customerPortalUrl: await stripeHelper.createPortalSessionUrl({ projectId: request.principal.projectId }),
            }
        },
    )

    fastify.post(
        '/upgrade',
        {
            schema: {
                body: UpgradeRequest,
            },
        },
        async (
            request,
        ) => {
            return billingService.upgrade({ projectId: request.principal.projectId, priceId: request.body.priceId })
        },
    )

    fastify.post(
        '/stripe/webhook',
        {
            config: {
                rawBody: true,
            },
        },
        async (
            request: FastifyRequest<Record<string, never>>,
            reply,
        ) => {
            const payloadString = request.rawBody
            const sig = request.headers['stripe-signature'] as string
            try {
                await stripeHelper.handleWebhook({ payload: payloadString as string, signature: sig })
                return reply.status(StatusCodes.OK).send()
            }
            catch (err) {
                logger.error(err)
                logger.warn('⚠️  Webhook signature verification failed.')
                logger.warn('⚠️  Check the env file and enter the correct webhook secret.')
                captureException(err)
                return reply.status(StatusCodes.BAD_REQUEST).send('Invalid webhook signature')
            }
        },
    )
}
