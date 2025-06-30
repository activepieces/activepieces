import {  ApSubscriptionStatus, CreateSubscriptionParams, getAiCreditsPriceId, getPlanPriceId, getTasksPriceId, getUserPriceId, PlanName } from '@activepieces/ee-shared'
import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { apDayjs } from '../../../helper/dayjs-helper'
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

    async startTrial(customerId: string, platformId: string) {
        const stripe = this.getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            trial_end: apDayjs().add(14, 'days').unix(),
            items: [
                { price: STRIPE_PLAN_PRICE_IDS[PlanName.PLUS], quantity: 1 },
            ],
            trial_settings: {
                end_behavior: {
                    missing_payment_method: 'cancel',
                },
            },
            metadata: {
                platformId,
                trialSubscription: 'true',
            },
        })



        return subscription.id
    },
    
    createSubscriptionCheckoutUrl: async (
        platformId: string,
        customerId: string,
        params: CreateSubscriptionParams,
    ): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const basePriceId = STRIPE_PLAN_PRICE_IDS[params.plan]
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price: basePriceId,
                quantity: 1,
            },
            {
                price: AI_CREDITS_PRICE_ID,
            },
        ]

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'subscription',
            subscription_data: {
                metadata: {
                    platformId,
                },
            },
            success_url: `${frontendUrl}/platform/setup/billing/success?action=create`,
            cancel_url: `${frontendUrl}/platform/setup/billing/error`,
            customer: customerId,
        })
        
        return session.url!
    },

    createSetupSession: async (platformId: string): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const { stripeCustomerId, stripeSubscriptionId } = await platformPlanService(log).getOrCreateForPlatform(platformId)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: stripeCustomerId,
            mode: 'setup',
            success_url: `${frontendUrl}/platform/setup/billing/success?action=setup`,
            cancel_url: `${frontendUrl}/platform/setup/billing/error`,
            metadata: {
                platformId,
                action: 'attach_payment_method',
                subscriptionId: stripeSubscriptionId!,
            },
        })
            
        return session.url!
    },

    createPortalSessionUrl: async (platformId: string): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const session = await stripe.billingPortal.sessions.create({
            customer: platformBilling.stripeCustomerId!,
            return_url: 'https://cloud.activepieces.com/platform/billing',
        })

        return session.url
    },


    attachPaymentMethod: async (
        stripe: Stripe,
        subscriptionId: string,
        customerId: string,
        paymentMethodId: string,
    ): Promise<void> => {
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        })

        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        })

        await stripe.subscriptions.update(subscriptionId, {
            collection_method: 'charge_automatically',
            default_payment_method: paymentMethodId,
        })

        log.info('Payment method attached.', { subscriptionId, customerId })
    },

    updateSubscription: async (
        platformId: string,
        subscriptionId: string,
        plan: PlanName.PLUS | PlanName.BUSINESS,
        extraUsers: number,
    ): Promise<void> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
        })


        const currentPlanItem = currentSubscription.items.data.find(
            item => Object.values(STRIPE_PLAN_PRICE_IDS).includes(item.price.id),
        )
        const currentAICreditsItem = currentSubscription.items.data.find(
            item => item.price.id === AI_CREDITS_PRICE_ID,
        )
        const currentUserSeatsItem = currentSubscription.items.data.find(
            item => item.price.id === USER_PRICE_ID,
        )

        const items: Stripe.SubscriptionUpdateParams.Item[] = [
            {
                id: currentPlanItem?.id,
                price: STRIPE_PLAN_PRICE_IDS[plan],
                quantity: 1,
            },
            {
                id: currentAICreditsItem?.id,
                price: AI_CREDITS_PRICE_ID,
            },
        ]

        if (plan === PlanName.BUSINESS && extraUsers > 0) {
            items.push({
                id: currentUserSeatsItem?.id,
                price: USER_PRICE_ID,
                quantity: extraUsers,
            })
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

        if (!isNil(currentSubscription.trial_end)) {
            updateParams.trial_end = 'now'
        }

        await stripe.subscriptions.update(subscriptionId, updateParams)
    },

    async getSubscriptionCycleDates(subscription: Stripe.Subscription): Promise<{ startDate: number, endDate: number, cancelDate?: number }> {
        const defaultStartDate = apDayjs().startOf('month').unix()
        const defaultEndDate = apDayjs().endOf('month').unix()
        const defaultCancelDate = undefined

        if (subscription.status !== ApSubscriptionStatus.ACTIVE && subscription.status !== ApSubscriptionStatus.TRIALING) {
            return { startDate: defaultStartDate, endDate: defaultEndDate, cancelDate: defaultCancelDate }
        }

        const relevantSubscriptionItem = subscription.items.data.find(
            item => Object.values(STRIPE_PLAN_PRICE_IDS).includes(item.price.id),
        )

        if (isNil(relevantSubscriptionItem)) {
            return { startDate: defaultStartDate, endDate: defaultEndDate, cancelDate: defaultCancelDate }
        }  

        return { startDate: relevantSubscriptionItem.current_period_start, endDate: relevantSubscriptionItem.current_period_end, cancelDate: subscription.cancel_at ?? undefined }
    },

    handleSubscriptionUpdate: async (
        platformId: string,
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

                await stripeHelper(log).updateSubscription(platformId, subscription.id, newPlan as PlanName.PLUS | PlanName.BUSINESS, extraUsers)
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

    const { startDate: currentPeriodStart, endDate: currentPeriodEnd } = await stripeHelper(logger).getSubscriptionCycleDates(subscription)
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
        const nextPhaseItems: Stripe.SubscriptionScheduleUpdateParams.Phase.Item[] = [
            {
                price: STRIPE_PLAN_PRICE_IDS[newPlan],
                quantity: 1,
            },
            { price: AI_CREDITS_PRICE_ID },
        ]

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