import { ApSubscriptionStatus } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { platformBillingService } from './platform-billing.service'
import { stripeHelper, stripeWebhookSecret } from './stripe-helper'

export const stripeBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post(
        '/stripe/webhook',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
                rawBody: true,
            },
        },
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string
                const stripe = stripeHelper(request.log).getStripe()
                assertNotNullOrUndefined(stripe, 'Stripe is not configured')
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    stripeWebhookSecret,
                )
                const subscription = webhook.data.object as Stripe.Subscription
                if (!stripeHelper(request.log).isPriceForTasks(subscription)) {
                    return {
                        message: 'Subscription does not have a price for tasks',
                    }
                }
                const platformBilling = await platformBillingService(request.log).updateSubscriptionIdByCustomerId(subscription)
                if (subscription.status === ApSubscriptionStatus.CANCELED) {
                    request.log.info(`Subscription canceled for project ${platformBilling.platformId}, downgrading to free plan`)
                    await platformBillingService(request.log).update({ platformId: platformBilling.platformId, tasksLimit: undefined })
                }
                return await reply.status(StatusCodes.OK).send()
            }
            catch (err) {
                request.log.error(err)
                request.log.warn('⚠️  Webhook signature verification failed.')
                exceptionHandler.handle(err, request.log)
                return reply
                    .status(StatusCodes.BAD_REQUEST)
                    .send('Invalid webhook signature')
            }
        },
    )
}