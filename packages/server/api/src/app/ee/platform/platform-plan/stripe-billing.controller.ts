import { AI_CREDITS_USAGE_THRESHOLD, ApSubscriptionStatus, STANDARD_CLOUD_PLAN } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { AiOverageState, ALL_PRINCIPAL_TYPES, isNil, PlanName } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { ACTIVE_FLOW_PRICE_ID, AI_CREDIT_PRICE_ID, platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const stripeBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post(
        '/stripe/webhook',
        WebhookRequest,
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string

                const stripe = stripeHelper(request.log).getStripe()
                if (isNil(stripe)) {
                    return await reply.status(StatusCodes.OK).send({ received: true })
                }

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
                        const platformId = subscription.metadata.platformId as string

                        const subscriptionStarted = webhook.type === 'customer.subscription.created'
                        if (subscriptionStarted) {
                            await addThresholdOnAiCreditsItem(stripe, subscription)
                        }

                        const { startDate, endDate, cancelDate } = await stripeHelper(request.log).getSubscriptionCycleDates(subscription)

                        const extraActiveFlows = subscription.items.data.find(item => ACTIVE_FLOW_PRICE_ID === item.price.id)?.quantity ?? 0
                        const newLimits = { ...STANDARD_CLOUD_PLAN }

                        const subscriptionEnded = webhook.type === 'customer.subscription.deleted'
                        if (subscriptionEnded) {
                            await platformPlanService(request.log).update({ 
                                ...newLimits,
                                platformId,
                                plan: PlanName.STANDARD,
                                stripeSubscriptionStatus: ApSubscriptionStatus.CANCELED,
                                aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
                                stripeSubscriptionId: undefined,
                                stripeSubscriptionStartDate: undefined,
                                stripeSubscriptionEndDate: undefined,
                                stripeSubscriptionCancelDate: undefined,
                            })
                            break
                        }

                        if (extraActiveFlows > 0) {
                            newLimits.activeFlowsLimit = (newLimits.activeFlowsLimit ?? 0) + extraActiveFlows
                        }

                        await platformPlanService(request.log).update({ 
                            ...newLimits,
                            platformId,
                            plan: PlanName.STANDARD,
                            stripeSubscriptionId: subscription.id,
                            stripeSubscriptionStatus: subscription.status as ApSubscriptionStatus,
                            aiCreditsOverageState: AiOverageState.ALLOWED_AND_ON,
                            aiCreditsOverageLimit: 500,
                            stripeSubscriptionStartDate: startDate,
                            stripeSubscriptionEndDate: endDate,
                            stripeSubscriptionCancelDate: cancelDate,
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

async function addThresholdOnAiCreditsItem(stripe: Stripe, subscription: Stripe.Subscription): Promise<void> {
    const subWithItems = subscription.items?.data?.length ? subscription : await stripe.subscriptions.retrieve(subscription.id, { expand: ['items.data'] })
    const aiCreditsItem = subWithItems.items.data.find(item => AI_CREDIT_PRICE_ID === item.price?.id)

    if (!aiCreditsItem) return
    await stripe.subscriptionItems.update(aiCreditsItem.id, { billing_thresholds: { usage_gte: AI_CREDITS_USAGE_THRESHOLD } })
}