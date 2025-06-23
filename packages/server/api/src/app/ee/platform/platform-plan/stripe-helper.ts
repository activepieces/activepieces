import {  ApSubscriptionStatus, CreateSubscriptionParams, getAiCreditsPriceId, getPlanPriceId, getTasksPriceId, getUserPriceId, PlanName } from '@activepieces/ee-shared'
import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { apDayjs } from '../../../helper/dayjs-helper'
import { system } from '../../../helper/system/system'
import { platformPlanRepo, platformPlanService } from './platform-plan.service'

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
            apiVersion: '2025-05-28.basil',
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

        lineItems.push({
            price: AI_CREDITS_PRICE_ID,
        })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'subscription',
            success_url: `${frontendUrl}/platform/setup/billing/success?action=create`,
            cancel_url: `${frontendUrl}/platform/setup/billing/error`,
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

        const currentPlanItem = currentSubscription.items.data.find(
            item => Object.values(STRIPE_PLAN_PRICE_IDS).includes(item.price.id),
        )
        const currentAICreditsItem = currentSubscription.items.data.find(
            item => item.price.id === AI_CREDITS_PRICE_ID,
        )
        const currentUserSeatsItem = currentSubscription.items.data.find(
            item => item.price.id === USER_PRICE_ID,
        )

        if (currentPlanItem) {
            items.push({
                id: currentPlanItem.id,
                price: STRIPE_PLAN_PRICE_IDS[plan],
                quantity: 1,
            })
        }
        else {
            items.push({
                price: STRIPE_PLAN_PRICE_IDS[plan],
                quantity: 1,
            })
        }

        if (currentAICreditsItem) {
            items.push({
                id: currentAICreditsItem.id,
                price: AI_CREDITS_PRICE_ID,
            })
        }
        else {
            items.push({
                price: AI_CREDITS_PRICE_ID,
            })
        }

        if (plan === PlanName.BUSINESS && extraUsers > 0) {
            if (currentUserSeatsItem) {
                items.push({
                    id: currentUserSeatsItem.id,
                    price: USER_PRICE_ID,
                    quantity: extraUsers,
                })
            }
            else {
                items.push({
                    price: USER_PRICE_ID,
                    quantity: extraUsers,
                })
            }
        }
        else if (currentUserSeatsItem) {
            items.push({
                id: currentUserSeatsItem.id,
                deleted: true,
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

    async getSubscriptionCycleDates(subscriptionId?: string): Promise<{ startDate: number, endDate: number, cancelDate?: number }> {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')


        const startDate = apDayjs().startOf('month').unix()
        const endDate = apDayjs().endOf('month').unix()
        if (isNil(subscriptionId)) {
            return { startDate, endDate }
        }

        const platformBilling = await platformPlanRepo().findOneBy({ stripeSubscriptionId: subscriptionId })
        if (isNil(platformBilling) || isNil(platformBilling.stripeSubscriptionId) || platformBilling.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
            return { startDate, endDate }
        }

        const subscription = await stripe.subscriptions.retrieve(platformBilling.stripeSubscriptionId, {
            expand: ['items.data.price'],
        })

        const mainPlanItem = subscription.items.data.find(
            item => Object.values(STRIPE_PLAN_PRICE_IDS).includes(item.price.id),
        )


        if (isNil(mainPlanItem)) {
            return { startDate, endDate }
        }

        const relevantSubscriptionItem = mainPlanItem

        return { startDate: relevantSubscriptionItem.current_period_start, endDate: relevantSubscriptionItem.current_period_end, cancelDate: subscription.cancel_at ?? undefined }
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

            return `/platform/setup/billing/success?action=${isUpgrade ? 'upgrade' : 'downgrade'}&plan=${newPlan}`
        }
        catch (error) {
            logger.error(`Failed to handle subscription scheduling ${error}`, { 
                subscriptionId, 
            })
            return '/platform/setup/billing/error'
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
): Promise<void> {

    const { startDate: currentPeriodStart, endDate: currentPeriodEnd } = await stripeHelper(logger).getSubscriptionCycleDates(subscription.id)

    const isFreeDowngrade = newPlan === PlanName.FREE

    const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
        {
            items: subscription.items.data.map(item => ({
                price: item.price.id,
                quantity: item.quantity !== null && item.quantity !== undefined ? item.quantity : undefined,
            })),
            start_date: currentPeriodStart,
            end_date: currentPeriodEnd,
        },
    ]

    if (!isFreeDowngrade) {
        const nextPhaseItems: Stripe.SubscriptionScheduleUpdateParams.Phase.Item[] = []

        nextPhaseItems.push({
            price: STRIPE_PLAN_PRICE_IDS[newPlan],
            quantity: 1,
        })

        nextPhaseItems.push({
            price: AI_CREDITS_PRICE_ID,
        })

        if (newPlan === PlanName.BUSINESS && extraUsers > 0) {
            nextPhaseItems.push({
                price: USER_PRICE_ID,
                quantity: extraUsers,
            })
        }

        phases.push({
            items: nextPhaseItems,
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

    logger.info('Updated subscription schedule for plan change', {
        scheduleId,
        subscriptionId: subscription.id,
        newPlan,
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
): Promise<Stripe.SubscriptionSchedule> {

    const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
    })

    await updateSubscriptionSchedule(stripe, schedule.id, subscription, newPlan, extraUsers, logger)

    return schedule
}