import {  ApSubscriptionStatus, CreateSubscriptionParams, getPriceIdFor, PlanName, PRICE_NAMES } from '@activepieces/ee-shared'
import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, PlatformRole, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { getRedisConnection } from '../../../database/redis-connection'
import { apDayjs } from '../../../helper/dayjs-helper'
import { system } from '../../../helper/system/system'
import { userService } from '../../../user/user-service'
import { platformPlanService } from './platform-plan.service'

export const stripeWebhookSecret = system.get(AppSystemProp.STRIPE_WEBHOOK_SECRET)!
const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL)
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const PLUS_PLAN_PRICE_ID = getPriceIdFor(PRICE_NAMES.PLUS_PLAN, stripeSecretKey)
export const BUSINESS_PLAN_PRICE_ID = getPriceIdFor(PRICE_NAMES.BUSINESS_PLAN, stripeSecretKey)
export const AI_CREDIT_PRICE_ID = getPriceIdFor(PRICE_NAMES.AI_CREDITS, stripeSecretKey)
export const ACTIVE_FLOW_PRICE_ID = getPriceIdFor(PRICE_NAMES.ACTIVE_FLOWS, stripeSecretKey)
export const PROJECT_PRICE_ID = getPriceIdFor(PRICE_NAMES.PROJECT, stripeSecretKey)
export const USER_SEAT_PRICE_ID = getPriceIdFor(PRICE_NAMES.USER_SEAT, stripeSecretKey)

export const stripeHelper = (log: FastifyBaseLogger) => ({
    getStripe: (): Stripe | undefined => {
        if (system.getEdition() !== ApEdition.CLOUD) return undefined

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
                customer_key: `ps_cus_key_${user.email}`,
            },
        })
        return newCustomer.id
    },

    async startTrial(customerId: string, platformId: string) {
        const stripe = this.getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const redisConnection = getRedisConnection()
        const key = `trial-gift-${platformId}-${customerId}`
        const trialPeriod = await redisConnection.get(key)

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            trial_end: isNil(trialPeriod) ? apDayjs().add(14, 'days').unix() : Number(trialPeriod),
            items: [
                { price: PLUS_PLAN_PRICE_ID, quantity: 1 },
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
    async giftTrialForCustomer(email: string, trialPeriod: number) {
        const trialPeriodInUnixTime = dayjs().add(trialPeriod, 'months').unix()
        const stripe = this.getStripe()
        if (isNil(stripe)) {
            return { email, message: 'Stripe not configured' }
        }

        try {
            const identity = await userIdentityService(log).getIdentityByEmail(email)
            if (isNil(identity)) {
                return { email, message: `No user exists with email: ${email}` }
            }
                
            const user = await userService.getOneByIdentityIdOnly({ identityId: identity.id })
            if (isNil(user) || isNil(user.platformId) || user.platformRole !== PlatformRole.ADMIN) {
                return { email, message: 'User doesn\'t own any platform' }
            }
                
            const platformPlan = await platformPlanService(log).getOrCreateForPlatform(user.platformId)
            assertNotNullOrUndefined(platformPlan.stripeCustomerId, 'customerId is not set')
                
            if (isNil(platformPlan.stripeSubscriptionId) || platformPlan.stripeSubscriptionStatus === ApSubscriptionStatus.CANCELED) {
                const redisConnection = getRedisConnection()
                const key = `trial-gift-${platformPlan.platformId}-${platformPlan.stripeCustomerId}`
                await platformPlanService(log).update({ platformId: platformPlan.platformId, eligibleForTrial: true })
                await redisConnection.set(key, trialPeriodInUnixTime)
                await redisConnection.expire(key, 60 * 60 * 15)

                return

            }
            else if (platformPlan.stripeSubscriptionStatus === ApSubscriptionStatus.TRIALING) {
                await stripe.subscriptions.update(platformPlan.stripeSubscriptionId, {
                    trial_end: trialPeriodInUnixTime,
                })
                return
            }
            else {
                return { email, message: 'User already has active subscription' }
            }
        }
        catch (error) {
            return { email, message: 'Unknown error, contact support for this.' }
        }
    },
    async createSubscriptionCheckoutUrl(
        platformId: string,
        customerId: string,
        params: CreateSubscriptionParams,
    ): Promise<string> {
        const stripe = this.getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const basePriceId = params.plan === PlanName.PLUS ? PLUS_PLAN_PRICE_ID : BUSINESS_PLAN_PRICE_ID
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price: basePriceId,
                quantity: 1,
            },
            {
                price: AI_CREDIT_PRICE_ID,
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

    async createPortalSessionUrl(platformId: string): Promise<string> {
        const stripe = this.getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const session = await stripe.billingPortal.sessions.create({
            customer: platformBilling.stripeCustomerId!,
            return_url: 'https://cloud.activepieces.com/platform/billing',
        })

        return session.url
    },

    async getSubscriptionCycleDates(subscription: Stripe.Subscription): Promise<{ startDate: number, endDate: number, cancelDate?: number }> {
        const defaultStartDate = apDayjs().startOf('month').unix()
        const defaultEndDate = apDayjs().endOf('month').unix()
        const defaultCancelDate = undefined

        if (subscription.status !== ApSubscriptionStatus.ACTIVE && subscription.status !== ApSubscriptionStatus.TRIALING) {
            return { startDate: defaultStartDate, endDate: defaultEndDate, cancelDate: defaultCancelDate }
        }

        const relevantSubscriptionItem = subscription.items.data.find(
            item => [PLUS_PLAN_PRICE_ID, BUSINESS_PLAN_PRICE_ID].includes(item.price.id),
        )

        if (isNil(relevantSubscriptionItem)) {
            return { startDate: defaultStartDate, endDate: defaultEndDate, cancelDate: defaultCancelDate }
        }  

        return { startDate: relevantSubscriptionItem.current_period_start, endDate: relevantSubscriptionItem.current_period_end, cancelDate: subscription.cancel_at ?? undefined }
    },

    handleSubscriptionUpdate: async (params: HandleSubscriptionUpdateParams): Promise<string> => {
        const { extraActiveFlows, extraProjects, extraUserSeats, isUpgrade, newPlan, subscriptionId  } = params

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

                await updateSubscription({ stripe, subscriptionId: subscription.id, plan: newPlan as PlanName.PLUS | PlanName.BUSINESS, extraUserSeats, extraActiveFlows, extraProjects })
            }
            else {
                if (relevantSchedules.length > 0) {
                    const schedule = relevantSchedules[0]
                    await updateSubscriptionSchedule({ stripe, scheduleId: schedule.id, subscription, newPlan, extraUserSeats, logger: log, extraActiveFlows, extraProjects })
                
                    for (let i = 1; i < relevantSchedules.length; i++) {
                        await stripe.subscriptionSchedules.cancel(relevantSchedules[i].id)
                    }
                }
                else {
                    await createSubscriptionSchedule({ stripe, subscription, newPlan, extraUserSeats, logger: log, extraActiveFlows, extraProjects })
                }
            }
            return `/platform/setup/billing/success?action=${isUpgrade ? 'upgrade' : 'downgrade'}&plan=${newPlan}`
     
        }
        catch (error) {
            log.error(`Failed to handle subscription scheduling ${error}`, { 
                subscriptionId, 
            })
            return '/platform/setup/billing/error'
        }
    },
})

async function updateSubscription(params: UpdateSubscriptionParams): Promise<void> {
    const { extraActiveFlows, extraProjects, extraUserSeats, plan, stripe, subscriptionId } = params

    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
    })
    const currentPlanItem = currentSubscription.items.data.find(
        item => [PLUS_PLAN_PRICE_ID, BUSINESS_PLAN_PRICE_ID].includes(item.price.id),
    )
    const currentAICreditsItem = currentSubscription.items.data.find(
        item => item.price.id === AI_CREDIT_PRICE_ID,
    )
    const currentUserSeatsItem = currentSubscription.items.data.find(
        item => item.price.id === USER_SEAT_PRICE_ID,
    )
    const currentActiveFlowsItem = currentSubscription.items.data.find(
        items => items.price.id === ACTIVE_FLOW_PRICE_ID,
    )
    const currentProjectsItem = currentSubscription.items.data.find(
        items => items.price.id === PROJECT_PRICE_ID,
    )

    const items: Stripe.SubscriptionUpdateParams.Item[] = []

    items.push({
        id: currentPlanItem?.id,
        price: plan === PlanName.PLUS ? PLUS_PLAN_PRICE_ID : BUSINESS_PLAN_PRICE_ID,
        quantity: 1,
    })

    items.push({
        id: currentAICreditsItem?.id,
        price: AI_CREDIT_PRICE_ID,
    })

    if (extraUserSeats > 0) {
        items.push({
            id: currentUserSeatsItem?.id,
            price: USER_SEAT_PRICE_ID,
            quantity: extraUserSeats,
        })
    }
    else if (!isNil(currentUserSeatsItem?.id) && extraUserSeats === 0) {
        items.push({
            id: currentUserSeatsItem.id,
            deleted: true,
        })
    }

    if (extraActiveFlows > 0) {
        items.push({
            id: currentActiveFlowsItem?.id,
            price: ACTIVE_FLOW_PRICE_ID,
            quantity: extraActiveFlows,
        })
    }
    else if (!isNil(currentActiveFlowsItem?.id) && extraActiveFlows === 0) {
        items.push({
            id: currentActiveFlowsItem.id,
            deleted: true,
        })
    }

    if (extraProjects > 0) {
        items.push({
            id: currentProjectsItem?.id,
            price: PROJECT_PRICE_ID,
            quantity: extraProjects,
        })
    }
    else if (!isNil(currentProjectsItem?.id) && extraProjects === 0) {
        items.push({
            id: currentProjectsItem.id,
            deleted: true,
        })
    }

    await stripe.subscriptions.update(subscriptionId, {
        items,
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: 'now',
    })
}

async function updateSubscriptionSchedule(params: UpdateSubscriptionScheduleParams): Promise<void> {
    const { extraActiveFlows, extraProjects, extraUserSeats, logger, newPlan, scheduleId, stripe, subscription  } = params

    const { startDate: currentPeriodStart, endDate: currentPeriodEnd } = await stripeHelper(logger).getSubscriptionCycleDates(subscription)
    const isFreeDowngrade = newPlan === PlanName.FREE

    const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
        {
            items: subscription.items.data.map(item => ({
                price: item.price.id,
                quantity: !isNil(item.quantity) ? item.quantity : undefined,
            })),
            start_date: currentPeriodStart,
            end_date: currentPeriodEnd,
        },
    ]

    if (!isFreeDowngrade) {
        const nextPhaseItems: Stripe.SubscriptionScheduleUpdateParams.Phase.Item[] = [
            {
                price: newPlan === PlanName.PLUS ? PLUS_PLAN_PRICE_ID : BUSINESS_PLAN_PRICE_ID,
                quantity: 1,
            },
            { price: AI_CREDIT_PRICE_ID },
        ]

        if (extraUserSeats > 0) {
            nextPhaseItems.push({
                price: USER_SEAT_PRICE_ID,
                quantity: extraUserSeats,
            })
        }
        if (extraProjects > 0) {
            nextPhaseItems.push({
                price: PROJECT_PRICE_ID,
                quantity: extraProjects,
            })
        }
        if (extraActiveFlows > 0) {
            nextPhaseItems.push({
                price: ACTIVE_FLOW_PRICE_ID,
                quantity: extraActiveFlows,
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

async function createSubscriptionSchedule(params: CreateSubscriptionScheduleParams): Promise<Stripe.SubscriptionSchedule> {
    const { extraActiveFlows, extraProjects, extraUserSeats, logger, newPlan, stripe, subscription } = params

    const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
    })

    await updateSubscriptionSchedule({ stripe, scheduleId: schedule.id, subscription, newPlan, extraUserSeats, logger, extraActiveFlows, extraProjects })

    return schedule
}

type HandleSubscriptionUpdateParams = {
    subscriptionId: string
    newPlan: PlanName
    extraUserSeats: number
    extraActiveFlows: number
    extraProjects: number
    isUpgrade: boolean
}

type UpdateSubscriptionParams = {
    stripe: Stripe
    subscriptionId: string
    plan: PlanName.PLUS | PlanName.BUSINESS
    extraUserSeats: number
    extraProjects: number
    extraActiveFlows: number
}

type UpdateSubscriptionScheduleParams = {
    stripe: Stripe
    scheduleId: string
    subscription: Stripe.Subscription
    newPlan: PlanName
    extraUserSeats: number
    extraProjects: number
    extraActiveFlows: number
    logger: FastifyBaseLogger
}

type CreateSubscriptionScheduleParams = {
    stripe: Stripe
    subscription: Stripe.Subscription
    newPlan: PlanName
    extraUserSeats: number
    extraProjects: number
    extraActiveFlows: number
    logger: FastifyBaseLogger
}