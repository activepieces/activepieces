import { ApSubscriptionStatus, PlanName } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { platformPlanService } from './platform-plan.service'
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
                
                const isPlanBasedSubscription = stripeHelper(request.log).isPriceForPlan(subscription)
                const isTaskBasedSubscription = stripeHelper(request.log).isPriceForTasks(subscription)
                
                if (!isPlanBasedSubscription && !isTaskBasedSubscription) {
                    return {
                        message: 'Subscription does not have a recognized price type',
                    }
                }
                
                const platformBilling = await platformPlanService(request.log).updateSubscriptionIdByCustomerId(subscription)
                
                if (subscription.status === ApSubscriptionStatus.CANCELED) {
                    request.log.info(`Subscription canceled for platform ${platformBilling.platformId}, downgrading to free plan`)
                    await platformPlanService(request.log).update({ platformId: platformBilling.platformId, tasksLimit: undefined })
                }
                else if (subscription.status === ApSubscriptionStatus.ACTIVE && isPlanBasedSubscription) {
                    const planName = subscription.metadata?.plan as PlanName.PLUS | PlanName.BUSINESS

                    if (planName) {
                        request.log.info(`Plan-based subscription activated for platform ${platformBilling.platformId}, plan: ${planName}`)
                        
                        const addons = {
                            extraUsers: 0,
                            extraFlows: 0,
                            extraAiCredits: 0,
                        }
                        
                        const planLimits = platformPlanService(request.log).getPlanLimits(planName, addons)
                        await platformPlanService(request.log).update({ 
                            platformId: platformBilling.platformId, 
                            ...planLimits, 
                        })
                    }
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