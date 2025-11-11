import { AI_CREDITS_USAGE_THRESHOLD, ApSubscriptionStatus, getPlanLimits } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { AiOverageState, ALL_PRINCIPAL_TYPES, isNil, PlanName } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformUsageService } from '../platform-usage-service'
import { ACTIVE_FLOW_PRICE_IDS, AI_CREDIT_PRICE_IDS, BUSINESS_PLAN_PRICE_IDS, PlatformPlanHelper, PLUS_PLAN_PRICE_IDS, PROJECT_PRICE_IDS, USER_SEAT_PRICE_IDS } from './platform-plan-helper'
import { platformPlanService } from './platform-plan.service'
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

                        const isUnknowSubscription = subscription.items.data.every(item => ![...PLUS_PLAN_PRICE_IDS, ...BUSINESS_PLAN_PRICE_IDS].includes(item.price.id))
                        if (isUnknowSubscription) {
                            break
                        }

                        const subscriptionStarted = webhook.type === 'customer.subscription.created'
                        if (subscriptionStarted) {
                            await addThresholdOnAiCreditsItem(stripe, subscription)
                        }

                        const { plan: newPlan, cycle } = PlatformPlanHelper.getPlanFromSubscription(subscription)
                        request.log.info({
                            webhookType: webhook.type,
                            subscriptionStatus: subscription.status,
                            newPlan,
                        }, 'Processing subscription event')

                        const { startDate, endDate, cancelDate } = await stripeHelper(request.log).getSubscriptionCycleDates(subscription)
                        const { stripeSubscriptionId } = await platformPlanService(request.log).updateByCustomerId({
                            subscriptionId: subscription.id,
                            customerId: subscription.customer.toString(),
                            status: subscription.status as ApSubscriptionStatus,
                            startDate,
                            endDate,
                            cancelDate,
                            stripePaymentMethod: subscription.default_payment_method as string ?? undefined,
                        })

                        const extraUsers = subscription.items.data.find(item => USER_SEAT_PRICE_IDS.includes(item.price.id))?.quantity ?? 0
                        const extraActiveFlows = subscription.items.data.find(item => ACTIVE_FLOW_PRICE_IDS.includes(item.price.id))?.quantity ?? 0
                        const extraProjects = subscription.items.data.find(item => PROJECT_PRICE_IDS.includes(item.price.id))?.quantity ?? 0

                        const newLimits = getPlanLimits(newPlan)
                        const isFreePlan = newPlan === PlanName.FREE
                        const isAddonUpgrade =  extraUsers > 0 || extraActiveFlows > 0 || extraProjects > 0
                        const shouldResetPlatfromUsage = isFreePlan || !isAddonUpgrade

                        if (isAddonUpgrade) {
                            newLimits.userSeatsLimit = (newLimits.userSeatsLimit ?? 0) + extraUsers
                            newLimits.activeFlowsLimit = (newLimits.activeFlowsLimit ?? 0) + extraActiveFlows
                            newLimits.projectsLimit = (newLimits.projectsLimit ?? 0) + extraProjects
                        }

                        await PlatformPlanHelper.handleResourceLocking({ platformId, newLimits })
                        
                        if (shouldResetPlatfromUsage) {
                            await platformUsageService(request.log).resetPlatformUsage(platformId)
                        }

                        await platformPlanService(request.log).update({ 
                            ...newLimits,
                            platformId,
                            stripeBillingCycle: cycle,
                            stripeSubscriptionId: isFreePlan ? undefined : stripeSubscriptionId,
                            aiCreditsOverageState: isFreePlan ? AiOverageState.NOT_ALLOWED : AiOverageState.ALLOWED_BUT_OFF,
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
    const aiCreditsItem = subWithItems.items.data.find(item => AI_CREDIT_PRICE_IDS.includes(item.price?.id))

    if (!aiCreditsItem) return
    await stripe.subscriptionItems.update(aiCreditsItem.id, { billing_thresholds: { usage_gte: AI_CREDITS_USAGE_THRESHOLD } })
}