import { getTasksPriceId } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../helper/system/system'
import { platformBillingService } from './platform-billing.service'
import { usageService } from './usage/usage-service'

export const stripeWebhookSecret = system.get(
    AppSystemProp.STRIPE_WEBHOOK_SECRET,
)!

export const TASKS_PAYG_PRICE_ID = getTasksPriceId(system.get(AppSystemProp.STRIPE_SECRET_KEY) ?? '')

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
    createCheckoutUrl: async (
        customerId: string,
    ): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        const startBillingPeriod = usageService(log).getCurrentBillingPeriodStart()
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
    createPortalSessionUrl: async ({ platformId }: { platformId: string }): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
        const session = await stripe.billingPortal.sessions.create({
            customer: platformBilling.stripeCustomerId,
            return_url: 'https://cloud.activepieces.com/platform/billing',
        })
        return session.url
    },
    isPriceForTasks: (subscription: Stripe.Subscription): boolean => {
        return subscription.items.data.some((item) => item.price.id === TASKS_PAYG_PRICE_ID)
    },
})
