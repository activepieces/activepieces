import { PlanName } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper  } from './stripe-helper'

export const stripeBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post(
        '/stripe/webhook',
        WebhookRequest,
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string
                const stripe = stripeHelper(request.log).getStripe()
                assertNotNullOrUndefined(stripe, 'Stripe is not configured')

                const webhookSecret = 'whsec_9ddb3abe20c8fd95a4c77874b03bc527155879ffea474d7153563b1b28c8914b'
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    webhookSecret,
                )
                const subscription = webhook.data.object as Stripe.Subscription
                const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(subscription.metadata?.platformId as string)

                if (webhook.type === 'customer.subscription.updated' && subscription.metadata.event === 'update_subscription') {
                    const planName = subscription.metadata?.plan as PlanName.PLUS | PlanName.BUSINESS | PlanName.FREE

                    request.log.info(`${planName} subscription upgraded for platform ${platformBilling.platformId}`)

                    const planLimits = platformPlanService(request.log).getPlanLimits(planName)
                    if (planName === PlanName.BUSINESS && !isNil(subscription.metadata.extraUsers) && Number(subscription.metadata.extraUsers) > 0) {
                        planLimits.userSeatsLimit = (planLimits.userSeatsLimit ?? 0) + Number(subscription.metadata.extraUsers)
                    }

                    const platformId = subscription.metadata?.platformId as string
                    const platformPlan = await platformPlanService(request.log).update({ 
                        platformId,
                        ...planLimits,
                    })

                    return platformPlan
                }

                if (webhook.type === 'customer.subscription.created' && subscription.metadata.event === 'create_subscription') {
                    const platformBilling = await platformPlanService(request.log).updateSubscriptionIdByCustomerId(subscription)
                    const planName = subscription.metadata?.plan as PlanName.PLUS | PlanName.BUSINESS | PlanName.FREE

                    request.log.info(`${planName} subscription activated for platform ${platformBilling.platformId}`)

                    const planLimits = platformPlanService(request.log).getPlanLimits(planName)
                    await platformPlanService(request.log).update({ 
                        platformId: platformBilling.platformId, 
                        ...planLimits, 
                    })
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


const WebhookRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rawBody: true,
    },
}