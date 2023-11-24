import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { stripe, stripeHelper, stripeWebhookSecret } from './stripe-helper'
import { billingService } from './billing.service'
import { UpgradeRequest } from '@activepieces/ee-shared'
import Stripe from 'stripe'
import { plansService } from '../project-plan/project-plan.service'
import { captureException, logger } from '../../../helper/logger'
import { projectUsageService } from '../project-usage/project-usage-service'
import { defaultPlanInformation } from '../project-plan/pricing-plans'
import { assertNotNullOrUndefined } from '@activepieces/shared'

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
                usage: await projectUsageService.getUsageByProjectId(request.principal.projectId),
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
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    const webhook = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret)
    const subscription = webhook.data.object as Stripe.Subscription
    if (isSubscriptionPlatformOrCustom(subscription)) {
        return
    }
    const projectPlan = await plansService.getBySubscriptionId({
        stripeSubscriptionId: subscription.id,
    })
    switch (webhook.type) {
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
            await billingService.update({ subscription, projectId: projectPlan.projectId })
            break
        }
        default:
            throw new Error('Unkown type ' + webhook.type)
    }
}

function isSubscriptionPlatformOrCustom(subscription: Stripe.Subscription): boolean {
    return Object.values(subscription.metadata).includes('PLATFORM') || Object.values(subscription.metadata).includes('CUSTOM')
}