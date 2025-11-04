import { BillingCycle } from '@activepieces/ee-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import Stripe from 'stripe'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { AI_CREDIT_PRICE_ID } from './platform-plan-helper'
import { platformPlanController } from './platform-plan.controller'
import { platformPlanService } from './platform-plan.service'
import { stripeBillingController } from './stripe-billing.controller'
import { stripeHelper } from './stripe-helper'

export const platformPlanModule: FastifyPluginAsyncTypebox = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.AI_USAGE_REPORT, async (data) => {
        const log = app.log
        log.info('Running ai-usage-report')

        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const { platformId, overage, idempotencyKey } = data
        const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
        assertNotNullOrUndefined(platformBilling, 'Plan is not set')

        const subscriptionId = platformBilling.stripeSubscriptionId
        if (isNil(subscriptionId)) {
            return
        }

        const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const item = subscription.items.data.find((item) => [AI_CREDIT_PRICE_ID[BillingCycle.MONTHLY], AI_CREDIT_PRICE_ID[BillingCycle.ANNUAL]].includes(item.price.id ))
        if (isNil(item)) {
            return
        }

        await stripe.billing.meterEvents.create({
            event_name: 'ai_credits_sumed',
            payload: {
                value: overage.toString(),
                stripe_customer_id: subscription.customer as string,
            },
        }, { idempotencyKey })
    })

    await app.register(platformPlanController, { prefix: '/v1/platform-billing' })
    await app.register(stripeBillingController, { prefix: '/v1/stripe-billing' })
}