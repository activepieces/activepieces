import {  getPriceId, getTasksPriceId, PaymentTiming, PlanName, UpgradeSubscriptionParams } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'

export const stripeWebhookSecret = system.get(
    AppSystemProp.STRIPE_WEBHOOK_SECRET,
)!

const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const TASKS_PAYG_PRICE_ID = getTasksPriceId(stripeSecretKey)
export const STRIPE_PRICE_IDS = getPriceId(stripeSecretKey)

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

        if (!stripe) {
            throw new Error('Stripe is not enabled')
        }

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
        params: UpgradeSubscriptionParams,
    ): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
        
        const basePriceId = STRIPE_PRICE_IDS[params.plan][params.billing]
        lineItems.push({
            price: basePriceId,
            quantity: 1,
        })
        
        if (params.addons.extraUsers && params.addons.extraUsers > 0) {
            lineItems.push({
                price: STRIPE_PRICE_IDS.ADDONS.EXTRA_USERS,
                quantity: params.addons.extraUsers,
            })
        }
        
        if (params.addons.extraFlows && params.addons.extraFlows > 0) {
            lineItems.push({
                price: STRIPE_PRICE_IDS.ADDONS.EXTRA_FLOWS,
                quantity: params.addons.extraFlows,
            })
        }
        
        if (params.addons.extraAiCredits && params.addons.extraAiCredits > 0) {
            const creditBundles = Math.ceil(params.addons.extraAiCredits / 100)
            lineItems.push({
                price: STRIPE_PRICE_IDS.ADDONS.EXTRA_AI_CREDITS,
                quantity: creditBundles,
            })
        }
        
        const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {}
        
        if (params.paymentTiming === PaymentTiming.END_OF_MONTH) {
            const currentPeriodEnd = platformUsageService(log).getCurrentBillingPeriodEnd()
            subscriptionData.billing_cycle_anchor = dayjs(currentPeriodEnd).unix()
        }
        
        subscriptionData.proration_behavior = params.prorationBehavior
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            subscription_data: subscriptionData,
            mode: 'subscription',
            success_url: 'https://cloud.activepieces.com/platform/billing?success=true',
            cancel_url: 'https://cloud.activepieces.com/platform/billing?canceled=true',
            customer: customerId,
            allow_promotion_codes: true,
            metadata: {
                plan: params.plan,
                billing: params.billing,
                paymentTiming: params.paymentTiming,
                prorationBehavior: params.prorationBehavior,
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
                    price: TASKS_PAYG_PRICE_ID,
                },
            ],
            subscription_data: {
                billing_cycle_anchor: dayjs(startBillingPeriod).add(30, 'day').unix(),
            },
            mode: 'subscription',
            success_url: 'https://cloud.activepieces.com/platform/billing',
            cancel_url: 'https://cloud.activepieces.com/platform/billing',
            customer: customerId,
        })
        return session.url!
    },

    upgradeSubscription: async (
        subscriptionId: string,
        params: UpgradeSubscriptionParams,
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
            price: STRIPE_PRICE_IDS[params.plan][params.billing],
            quantity: 1,
        })
        
        if (params.addons.extraUsers && params.addons.extraUsers > 0) {
            items.push({
                price: STRIPE_PRICE_IDS.ADDONS.EXTRA_USERS,
                quantity: params.addons.extraUsers,
            })
        }
        
        if (params.addons.extraFlows && params.addons.extraFlows > 0) {
            items.push({
                price: STRIPE_PRICE_IDS.ADDONS.EXTRA_FLOWS,
                quantity: params.addons.extraFlows,
            })
        }
        
        if (params.addons.extraAiCredits && params.addons.extraAiCredits > 0) {
            const creditBundles = Math.ceil(params.addons.extraAiCredits / 100)
            items.push({
                price: STRIPE_PRICE_IDS.ADDONS.EXTRA_AI_CREDITS,
                quantity: creditBundles,
            })
        }
        
        const updateParams: Stripe.SubscriptionUpdateParams = {
            items,
            proration_behavior: params.prorationBehavior,
            metadata: {
                plan: params.plan,
                billing: params.billing,
                upgraded_at: new Date().toISOString(),
            },
        }
        
        if (params.paymentTiming === PaymentTiming.END_OF_MONTH) {
            const currentPeriodEnd = platformUsageService(log).getCurrentBillingPeriodEnd()
            updateParams.trial_end = dayjs(currentPeriodEnd).unix()
        }
        
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
        return subscription.items.data.some((item) => item.price.id === TASKS_PAYG_PRICE_ID)
    },
    
    isPriceForPlan: (subscription: Stripe.Subscription): boolean => {
        const allPlanPrices = [
            ...Object.values(STRIPE_PRICE_IDS[PlanName.PLUS]),
            ...Object.values(STRIPE_PRICE_IDS[PlanName.BUSINESS]),
        ]
        return subscription.items.data.some((item) => allPlanPrices.includes(item.price.id))
    },
})