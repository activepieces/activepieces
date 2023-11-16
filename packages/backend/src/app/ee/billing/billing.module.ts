import { FastifyRequest } from 'fastify'
import { plansService } from './plans/plan.service'
import { StatusCodes } from 'http-status-codes'
import { captureException, logger } from '../../helper/logger'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { stripe, stripeHelper, stripeWebhookSecret } from './stripe/stripe-helper'
import { usageService } from './usage/usage-service'
import { defaultPlanInformation } from './plans/pricing-plans'
import { billingService } from './billing.service'
import { UpgradeRequest } from '@activepieces/ee-shared'
import Stripe from 'stripe'

export const billingModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(billingController, { prefix: '/v1/billing' })
}

const billingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/',
        async (
            request,
        ) => {
            return {
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
            return billingService.upgrade({ projectId: request.principal.projectId, request: request.body })
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
                await handleWebhook({ payload: payloadString as string, signature: sig })
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


async function handleWebhook({ payload, signature }: { payload: string, signature: string }): Promise<void> {
    const webhook = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret)
    const subscription = webhook.data.object as Stripe.Subscription
    const stripeCustomerId = subscription.customer as string
    const projectPlan = await plansService.getByStripeCustomerId({
        stripeCustomerId,
    })
    switch (webhook.type) {
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
            await billingService.update({ subscription, projectPlanId: projectPlan.id })
            break
        }
        default:
            throw new Error('Unkown type ' + webhook.type)
    }
}
