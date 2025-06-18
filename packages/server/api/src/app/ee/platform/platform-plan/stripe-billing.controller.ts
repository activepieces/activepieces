import { DEFAULT_BUSINESS_SEATS, getPlanFromSubscription, PlanName  } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper, USER_PRICE_ID } from './stripe-helper'

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

                const webhookSecret = system.getOrThrow(AppSystemProp.STRIPE_WEBHOOK_SECRET)
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    webhookSecret,
                )

                switch (webhook.type) {
                    case 'customer.subscription.deleted': 
                    case 'customer.subscription.created':
                    case 'customer.subscription.updated': {
                        const subscription = webhook.data.object as Stripe.Subscription
            
                        const platformPlan = await platformPlanService(request.log).updateSubscriptionStatus({
                            id: subscription.id,
                            status: subscription.status,
                        })
            
                        const newPlan = getPlanFromSubscription(subscription)

                        const extraUsers = subscription.items.data.find(item => item.price.id === USER_PRICE_ID)?.quantity ?? 0

                        request.log.info('Processing subscription event', {
                            webhookType: webhook.type,
                            subscriptionStatus: subscription.status,
                            newPlan,
                            extraUsers,
                        })

                        const planLimits = platformPlanService(request.log).getPlanLimits(newPlan)

                        if (newPlan !== PlanName.FREE) {
                            if (newPlan === PlanName.BUSINESS && extraUsers > 0) {
                                planLimits.userSeatsLimit = DEFAULT_BUSINESS_SEATS + extraUsers
                            }

                            planLimits.aiCreditsLimit = platformPlan.aiCreditsLimit
                        }
                        else {
                            planLimits.stripeSubscriptionId = undefined
                        }

                        await platformPlanService(request.log).update({ 
                            platformId: platformPlan.platformId,
                            ...planLimits,
                        })
            
                        break
                    }
                    default:
                        request.log.info(`Unhandled webhook event type: ${webhook.type}`)
                        break
                }
    
                return await reply.status(StatusCodes.OK).send({ received: true })
    
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