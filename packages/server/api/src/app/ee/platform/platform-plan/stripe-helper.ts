import {  CreateSubscriptionParams, getAiCreditsPriceId, getPlanPriceId, getTasksPriceId, getUserPriceId, PlanName } from '@activepieces/ee-shared'
import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformPlanService } from './platform-plan.service'

export const stripeWebhookSecret = system.get(
    AppSystemProp.STRIPE_WEBHOOK_SECRET,
)!
const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL)
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const TASKS_PRICE_ID = getTasksPriceId(stripeSecretKey)
export const STRIPE_PLAN_PRICE_IDS = getPlanPriceId(stripeSecretKey)
export const USER_PRICE_ID = getUserPriceId(stripeSecretKey)
export const AI_CREDITS_PRICE_ID = getAiCreditsPriceId(stripeSecretKey)

export const stripeHelper = (log: FastifyBaseLogger) => ({
    getStripe: (): Stripe | undefined => {
        const edition = system.getEdition()
        if (edition !== ApEdition.CLOUD) {
            return undefined
        }

        const stripeSecret = system.getOrThrow(AppSystemProp.STRIPE_SECRET_KEY)
        return new Stripe(stripeSecret, {
            apiVersion: '2023-10-16',
        })
    },

    async createCustomer(user: UserWithMetaInformation, platformId: string) {
        const stripe = this.getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`, 
            description: `Platform ID: ${platformId}, user ${user.id}`,
            metadata: {
                platformId,
            },
        })

        return newCustomer.id
    },
    
    createSubscriptionCheckoutUrl: async (
        customerId: string,
        params: CreateSubscriptionParams,
    ): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
        const basePriceId = STRIPE_PLAN_PRICE_IDS[params.plan]

        lineItems.push({
            price: basePriceId,
            quantity: 1,
        })
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'subscription',
            success_url: `${frontendUrl}/platform/setup/billing`,
            cancel_url: `${frontendUrl}/platform/setup/billing`,
            customer: customerId,
        })
        
        return session.url!
    },

    createPortalSessionUrl: async ({ platformId }: { platformId: string }): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const session = await stripe.billingPortal.sessions.create({
            customer: platformBilling.stripeCustomerId!,
            return_url: 'https://cloud.activepieces.com/platform/billing',
        })

        return session.url
    },


    updateSubscription: async (
        subscriptionId: string,
        plan: PlanName.PLUS | PlanName.BUSINESS,
        extraUsers: number,
    ): Promise<void> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
        })

        const items: Stripe.SubscriptionUpdateParams.Item[] = []
        currentSubscription.items.data.forEach(item => {
            items.push({ id: item.id, deleted: true })
        })

        items.push({
            price: STRIPE_PLAN_PRICE_IDS[plan],
            quantity: 1,
        })

        if (plan === PlanName.BUSINESS && !isNil(extraUsers) && extraUsers > 0) {
            items.push({
                price: USER_PRICE_ID,
                quantity: extraUsers,
            })
        }

        const updateParams: Stripe.SubscriptionUpdateParams = {
            items,
            proration_behavior: 'create_prorations',
            billing_cycle_anchor: 'now',
            metadata: {
                plan,
            },
        }

        await stripe.subscriptions.update(subscriptionId, updateParams)
    },

    handleSubscriptionUpdate: async (
        subscriptionId: string,
        newPlan: PlanName,
        extraUsers: number,
        logger: FastifyBaseLogger,
        isUpgrade: boolean,
    ): Promise<string> => {
        try {
            const stripe = stripeHelper(log).getStripe()
            assertNotNullOrUndefined(stripe, 'Stripe is not configured')

            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['items.data.price'],
            })
            const schedules = await stripe.subscriptionSchedules.list({
                customer: subscription.customer as string,
                limit: 10,
            })
        
            const relevantSchedules = schedules.data.filter(schedule => 
                schedule.subscription === subscription.id || 
            schedule.status === 'active' || 
            schedule.status === 'not_started',
            )

            if (isUpgrade) {
                for (const schedule of relevantSchedules) {
                    await stripe.subscriptionSchedules.cancel(schedule.id)
                }

                await stripeHelper(log).updateSubscription(subscription.id, newPlan as PlanName.PLUS | PlanName.BUSINESS, extraUsers)

            }
            else {
                if (relevantSchedules.length > 0) {
                    const schedule = relevantSchedules[0]
                    await updateSubscriptionSchedule(stripe, schedule.id, subscription, newPlan, extraUsers, logger)
                
                    for (let i = 1; i < relevantSchedules.length; i++) {
                        await stripe.subscriptionSchedules.cancel(relevantSchedules[i].id)
                    }
                }
                else {
                    await createSubscriptionSchedule(stripe, subscription, newPlan, extraUsers, logger)
                }
            }

            return `https://${frontendUrl}/platform/setup/billing/success`
        }
        catch (error) {
            logger.error(`Failed to handle subscription scheduling ${error}`, { 
                subscriptionId, 
            })
            return `https://${frontendUrl}/platform/setup/billing/error`
        }
    },
})

async function updateSubscriptionSchedule(
    stripe: Stripe, 
    scheduleId: string, 
    subscription: Stripe.Subscription,
    newPlan: PlanName,
    extraUsers: number,
    logger: FastifyBaseLogger,
) {
    const currentPeriodEnd = subscription.current_period_end
    const isFreeDowngrade = newPlan === PlanName.FREE

    const  phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
        {
            items: subscription.items.data.map(item => ({
                price: item.price.id,
                quantity: item.quantity || 1,
            })),
            start_date: subscription.current_period_start,
            end_date: currentPeriodEnd,
        },
    ]

    if (!isFreeDowngrade) {
        const downgradePhase: Stripe.SubscriptionScheduleUpdateParams.Phase.Item[] = []

        downgradePhase.push({
            price: STRIPE_PLAN_PRICE_IDS[newPlan],
            quantity: 1,
        })

        if (newPlan === PlanName.BUSINESS && extraUsers > 0) {
            downgradePhase.push({
                price: USER_PRICE_ID,
                quantity: extraUsers,
            })
        }
            
        phases.push({
            items: downgradePhase,
            start_date: currentPeriodEnd,
        })
    }

    await stripe.subscriptionSchedules.update(scheduleId, {
        phases,
        end_behavior: isFreeDowngrade ? 'cancel' : 'release',
        metadata: {
            plan: newPlan,
            downgrade_scheduled: 'true',
        },
    })
    
    logger.info('Updated subscription schedule for downgrade', { 
        scheduleId, 
        subscriptionId: subscription.id,
        downgradePlan: newPlan,
        effectiveDate: new Date(currentPeriodEnd * 1000).toISOString(),
        willCancel: isFreeDowngrade,
    })
}

async function createSubscriptionSchedule(
    stripe: Stripe, 
    subscription: Stripe.Subscription,
    newPlan: PlanName,
    extraUsers: number,
    logger: FastifyBaseLogger,
) {
    const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
    })

    await updateSubscriptionSchedule(stripe, schedule.id, subscription, newPlan, extraUsers, logger)
}