import { apDayjs, AppSystemProp, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { ACTIVE_FLOW_PRICE_ID, AI_CREDIT_PRICE_ID } from './platform-plan-helper'
import { platformPlanService } from './platform-plan.service'

export const stripeWebhookSecret = system.get(AppSystemProp.STRIPE_WEBHOOK_SECRET)!

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
            item => [AI_CREDIT_PRICE_ID, ACTIVE_FLOW_PRICE_ID].includes(item.price.id),
        )

        if (isNil(relevantSubscriptionItem)) {
            return { startDate: defaultStartDate, endDate: defaultEndDate, cancelDate: defaultCancelDate }
        }  

        return { startDate: relevantSubscriptionItem.current_period_start, endDate: relevantSubscriptionItem.current_period_end, cancelDate: subscription.cancel_at ?? undefined }
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