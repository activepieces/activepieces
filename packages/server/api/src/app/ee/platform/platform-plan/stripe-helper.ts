import {  BillingCycle, CreateSubscriptionParams } from '@activepieces/ee-shared'
import { apDayjs, AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, PlanName, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { ACTIVE_FLOW_PRICE_ID, AI_CREDIT_PRICE_ID, BUSINESS_PLAN_PRICE_ID, BUSINESS_PLAN_PRICE_IDS, PLUS_PLAN_PRICE_ID, PLUS_PLAN_PRICE_IDS, PROJECT_PRICE_ID, USER_SEAT_PRICE_ID } from './platform-plan-helper'
import { platformPlanService } from './platform-plan.service'

export const stripeWebhookSecret = system.get(AppSystemProp.STRIPE_WEBHOOK_SECRET)!
const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL)

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
    async createSubscriptionCheckoutUrl(
        platformId: string,
        customerId: string,
        params: CreateSubscriptionParams,
    ): Promise<string> {
        const stripe = this.getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const { plan, cycle, addons } = params

        const basePriceId = plan === PlanName.PLUS ? PLUS_PLAN_PRICE_ID[cycle] : BUSINESS_PLAN_PRICE_ID[cycle]
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price: basePriceId,
                quantity: 1,
            },
            {
                price: AI_CREDIT_PRICE_ID[cycle],
            },
        ]

        if (!isNil(addons.activeFlows) && addons.activeFlows > 0) {
            lineItems.push({
                price: ACTIVE_FLOW_PRICE_ID[cycle],
                quantity: addons.activeFlows,
            })
        }

        if (!isNil(addons.projects) && addons.projects > 0) {
            lineItems.push({
                price: PROJECT_PRICE_ID[cycle],
                quantity: addons.projects,
            })
        }

        if (!isNil(addons.userSeats) && addons.userSeats > 0) {
            lineItems.push({
                price: USER_SEAT_PRICE_ID[cycle],
                quantity: addons.userSeats,
            })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'subscription',
            subscription_data: {
                metadata: {
                    platformId,
                },
            },
            allow_promotion_codes: true,
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

        const relevantSubscriptionItem = subscription.items.data.find(
            item => [...PLUS_PLAN_PRICE_IDS, ...BUSINESS_PLAN_PRICE_IDS].includes(item.price.id),
        )

        if (isNil(relevantSubscriptionItem)) {
            return { startDate: defaultStartDate, endDate: defaultEndDate, cancelDate: defaultCancelDate }
        }  

        return { startDate: relevantSubscriptionItem.current_period_start, endDate: relevantSubscriptionItem.current_period_end, cancelDate: subscription.cancel_at ?? undefined }
    },
    handleSubscriptionUpdate: async (params: HandleSubscriptionUpdateParams): Promise<string> => {
        const { extraActiveFlows, extraProjects, extraUserSeats, isUpgrade, newPlan, subscriptionId, newCycle, currentCycle } = params

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
                    await stripe.subscriptionSchedules.release(schedule.id)
                }

                await updateSubscription({ stripe, subscriptionId: subscription.id, plan: newPlan as PlanName.PLUS | PlanName.BUSINESS, extraUserSeats, extraActiveFlows, extraProjects, newCycle, currentCycle })
            }
            else {
                if (relevantSchedules.length > 0) {
                    const schedule = relevantSchedules[0]
                    await updateSubscriptionSchedule({ stripe, scheduleId: schedule.id, subscription, newPlan, extraUserSeats, logger: log, extraActiveFlows, extraProjects, newCycle, currentCycle })
                
                    for (let i = 1; i < relevantSchedules.length; i++) {
                        await stripe.subscriptionSchedules.release(relevantSchedules[i].id)
                    }
                }
                else {
                    await createSubscriptionSchedule({ stripe, subscription, newPlan, extraUserSeats, logger: log, extraActiveFlows, extraProjects, newCycle, currentCycle })
                }
            }
            return `/platform/setup/billing/success?action=${isUpgrade ? 'upgrade' : 'downgrade'}&plan=${newPlan}`
     
        }
        catch (error) {
            log.error({ 
                error,
                subscriptionId, 
            }, 'Failed to handle subscription scheduling')
            return '/platform/setup/billing/error'
        }
    },
    deleteCustomer: async (subscriptionId: string): Promise<void> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        const invoices = await stripe.invoices.list({ subscription: subscriptionId })
        for (const invoice of invoices.data) {
            if (invoice.id) {
                await stripe.invoices.pay(invoice.id)
            }
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        if (typeof subscription.customer === 'string') {
            await stripe.customers.del(subscription.customer)
        }
        else {
            await stripe.customers.del(subscription.customer.id)
        }
    },
})

async function updateSubscription(params: UpdateSubscriptionParams): Promise<void> {
    const { extraActiveFlows, extraProjects, extraUserSeats, plan, stripe, subscriptionId, newCycle, currentCycle } = params

    const items: Stripe.SubscriptionUpdateParams.Item[] = []
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
    })

    const findItem = (priceIds: string[]) => 
        currentSubscription.items.data.find(item => priceIds.includes(item.price.id))

    const currentPlanItem = findItem([PLUS_PLAN_PRICE_ID[currentCycle], BUSINESS_PLAN_PRICE_ID[currentCycle]])
    const currentAICreditsItem = findItem([AI_CREDIT_PRICE_ID[currentCycle]])
    const currentUserSeatsItem = findItem([USER_SEAT_PRICE_ID[currentCycle]])
    const currentActiveFlowsItem = findItem([ACTIVE_FLOW_PRICE_ID[currentCycle]])
    const currentProjectsItem = findItem([PROJECT_PRICE_ID[currentCycle]])

    if (newCycle !== currentCycle) {
        [currentPlanItem, currentAICreditsItem, currentUserSeatsItem, currentActiveFlowsItem, currentProjectsItem]
            .filter(item => item?.id)
            .forEach(item => items.push({ id: item!.id, deleted: true }))
    }

    items.push({
        id: newCycle === currentCycle ? currentPlanItem?.id : undefined,
        price: plan === PlanName.PLUS ? PLUS_PLAN_PRICE_ID[newCycle] : BUSINESS_PLAN_PRICE_ID[newCycle],
        quantity: 1,
    })

    items.push({
        id: newCycle === currentCycle ? currentAICreditsItem?.id : undefined,
        price: AI_CREDIT_PRICE_ID[newCycle],
    })

    const handleOptionalItem = (
        quantity: number, 
        priceId: string,
        currentItem?: Stripe.SubscriptionItem,
    ) => {
        if (quantity > 0) {
            items.push({
                id: newCycle === currentCycle ? currentItem?.id : undefined,
                price: priceId,
                quantity,
            })
        }
        else if (newCycle === currentCycle && currentItem?.id) {
            items.push({
                id: currentItem.id,
                deleted: true,
            })
        }
    }

    handleOptionalItem(extraUserSeats, USER_SEAT_PRICE_ID[newCycle], currentUserSeatsItem)
    handleOptionalItem(extraActiveFlows, ACTIVE_FLOW_PRICE_ID[newCycle], currentActiveFlowsItem)
    handleOptionalItem(extraProjects, PROJECT_PRICE_ID[newCycle], currentProjectsItem)

    await stripe.subscriptions.update(subscriptionId, {
        items,
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: 'now',
    })
}

async function updateSubscriptionSchedule(params: UpdateSubscriptionScheduleParams): Promise<void> {
    const { extraActiveFlows, extraProjects, extraUserSeats, logger, newPlan, scheduleId, stripe, subscription, currentCycle, newCycle } = params
    
    const { startDate: currentPeriodStart, endDate: currentPeriodEnd } = await stripeHelper(logger).getSubscriptionCycleDates(subscription)
    const isFreeDowngrade = newPlan === PlanName.FREE

    const buildPhaseItems = (cycle: BillingCycle, plan: PlanName, userSeats: number, projects: number, activeFlows: number) => {
        const items: Stripe.SubscriptionScheduleUpdateParams.Phase.Item[] = [
            {
                price: plan === PlanName.PLUS ? PLUS_PLAN_PRICE_ID[cycle] : BUSINESS_PLAN_PRICE_ID[cycle],
                quantity: 1,
            },
            { price: AI_CREDIT_PRICE_ID[cycle] },
        ]

        const optionalItems = [
            { condition: userSeats > 0, price: USER_SEAT_PRICE_ID[cycle], quantity: userSeats },
            { condition: projects > 0, price: PROJECT_PRICE_ID[cycle], quantity: projects },
            { condition: activeFlows > 0, price: ACTIVE_FLOW_PRICE_ID[cycle], quantity: activeFlows },
        ]

        optionalItems.forEach(({ condition, price, quantity }) => {
            if (condition) {
                items.push({ price, quantity })
            }
        })

        return items
    }

    const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = []

    let currentPhaseItems: Stripe.SubscriptionScheduleUpdateParams.Phase.Item[]

    if (currentCycle === newCycle) {
        currentPhaseItems = subscription.items.data.map(item => ({
            price: item.price.id,
            quantity: !isNil(item.quantity) ? item.quantity : undefined,
        }))
    }
    else {
        const currentPlan = subscription.items.data.some(item => 
            [PLUS_PLAN_PRICE_ID[currentCycle], BUSINESS_PLAN_PRICE_ID[currentCycle]].includes(item.price.id),
        ) ? (subscription.items.data.some(item => item.price.id === PLUS_PLAN_PRICE_ID[currentCycle]) ? PlanName.PLUS : PlanName.BUSINESS) : PlanName.PLUS

        const currentUserSeats = subscription.items.data.find(item => item.price.id === USER_SEAT_PRICE_ID[currentCycle])?.quantity || 0
        const currentProjects = subscription.items.data.find(item => item.price.id === PROJECT_PRICE_ID[currentCycle])?.quantity || 0
        const currentActiveFlows = subscription.items.data.find(item => item.price.id === ACTIVE_FLOW_PRICE_ID[currentCycle])?.quantity || 0

        currentPhaseItems = buildPhaseItems(currentCycle, currentPlan, currentUserSeats, currentProjects, currentActiveFlows)
    }

    phases.push({
        items: currentPhaseItems,
        start_date: currentPeriodStart,
        end_date: currentPeriodEnd,
    })

    if (!isFreeDowngrade) {
        const nextPhaseItems = buildPhaseItems(newCycle, newPlan, extraUserSeats, extraProjects, extraActiveFlows)
        
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

    logger.info({
        scheduleId,
        subscriptionId: subscription.id,
        currentPlan: currentCycle === newCycle ? 'unchanged' : 'cycle-changed',
        newPlan,
        currentCycle,
        newCycle,
        effectiveDate: new Date(currentPeriodEnd * 1000).toISOString(),
        willCancel: isFreeDowngrade,
    }, 'Updated subscription schedule for plan change')
}

async function createSubscriptionSchedule(params: CreateSubscriptionScheduleParams): Promise<Stripe.SubscriptionSchedule> {
    const { extraActiveFlows, extraProjects, extraUserSeats, logger, newPlan, stripe, subscription, currentCycle, newCycle } = params

    const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
    })

    await updateSubscriptionSchedule({ stripe, scheduleId: schedule.id, subscription, newPlan, extraUserSeats, logger, extraActiveFlows, extraProjects, currentCycle, newCycle })
    return schedule
}

type HandleSubscriptionUpdateParams = {
    newCycle: BillingCycle
    currentCycle: BillingCycle
    subscriptionId: string
    newPlan: PlanName
    extraUserSeats: number
    extraActiveFlows: number
    extraProjects: number
    isUpgrade: boolean
}

type UpdateSubscriptionParams = {
    currentCycle: BillingCycle
    newCycle: BillingCycle
    stripe: Stripe
    subscriptionId: string
    plan: PlanName.PLUS | PlanName.BUSINESS
    extraUserSeats: number
    extraProjects: number
    extraActiveFlows: number
}

type UpdateSubscriptionScheduleParams = {
    currentCycle: BillingCycle
    newCycle: BillingCycle
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
    currentCycle: BillingCycle
    newCycle: BillingCycle
    stripe: Stripe
    subscription: Stripe.Subscription
    newPlan: PlanName
    extraUserSeats: number
    extraProjects: number
    extraActiveFlows: number
    logger: FastifyBaseLogger
}