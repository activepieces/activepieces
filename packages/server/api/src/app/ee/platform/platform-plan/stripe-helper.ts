import {  getAiCreditsPriceId, getPlanPriceId, getTasksPriceId, getUserPriceId, PlanName, UpdateSubscriptionParams } from '@activepieces/ee-shared'
import { AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformUsageService } from '../platform-usage-service'
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

        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            description: `Platform ID: ${platformId}, user ${user.id}`,
            metadata: {
                platformId,
            },
        })

        return customer.id
    },
    
    createSubscriptionCheckoutUrl: async (
        customerId: string,
        params: UpdateSubscriptionParams,
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

        if (params.plan === PlanName.BUSINESS && !isNil(params.extraUsers) && params.extraUsers > 0) {
            lineItems.push({
                price: USER_PRICE_ID,
                quantity: params.extraUsers!,
            })
        }
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'subscription',
            success_url: `${frontendUrl}/platform/setup/billing`,
            cancel_url: `${frontendUrl}/platform/setup/billing`,
            customer: customerId,
            subscription_data: {
                metadata: {
                    plan: params.plan,
                    event: 'create_subscription',
                },
            },
        })
        
        return session.url!
    },

    createCheckoutUrl: async (
        customerId: string,
    ): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const startBillingPeriod = platformUsageService(log).getCurrentBillingPeriodStart()
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: TASKS_PRICE_ID,
                },
            ],
            subscription_data: {
                billing_cycle_anchor: dayjs(startBillingPeriod).add(30, 'day').unix(),
            },
            mode: 'subscription',
            success_url: `${frontendUrl}/platform/billing`,
            cancel_url: `${frontendUrl}/platform/billing`,
            customer: customerId,
        })
        return session.url!
    },

    updateSubscription: async (
        subscriptionId: string,
        params: UpdateSubscriptionParams,
    ): Promise<Stripe.Subscription> => {
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
            price: STRIPE_PLAN_PRICE_IDS[params.plan],
            quantity: 1,
        })

        if (params.plan === PlanName.BUSINESS && !isNil(params.extraUsers) && params.extraUsers > 0) {
            items.push({
                price: USER_PRICE_ID,
                quantity: params.extraUsers,
            })
        }
        
        const updateParams: Stripe.SubscriptionUpdateParams = {
            items,
            proration_behavior: 'create_prorations',
            metadata: {
                plan: params.plan,
            },
        }
        
        const currentPeriodEnd = platformUsageService(log).getCurrentBillingPeriodEnd()
        updateParams.trial_end = dayjs(currentPeriodEnd).unix()
        
        return stripe.subscriptions.update(subscriptionId, updateParams)
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
    
    isPriceForTasks: (subscription: Stripe.Subscription): boolean => {
        return subscription.items.data.some((item) => item.price.id === TASKS_PRICE_ID)
    },
    
    isPriceForPlan: (subscription: Stripe.Subscription): boolean => {
        const allPlanPrices = [
            ...Object.values(STRIPE_PLAN_PRICE_IDS[PlanName.FREE]),
            ...Object.values(STRIPE_PLAN_PRICE_IDS[PlanName.PLUS]),
            ...Object.values(STRIPE_PLAN_PRICE_IDS[PlanName.BUSINESS]),
        ]

        return subscription.items.data.some((item) => allPlanPrices.includes(item.price.id))
    },
})