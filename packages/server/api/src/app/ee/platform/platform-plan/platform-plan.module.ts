import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { emailService } from '../../helper/email/email-service'
import { platformPlanController } from './platform-plan.controller'
import { platformPlanService } from './platform-plan.service'
import { stripeBillingController } from './stripe-billing.controller'
import { AI_CREDITS_PRICE_ID, stripeHelper } from './stripe-helper'

export const platformPlanModule: FastifyPluginAsyncTypebox = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.AI_USAGE_REPORT, async (data) => {
        const log = app.log
        log.info('Running ai-usage-report')

        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        const { platformId, overage } = data
        const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
        assertNotNullOrUndefined(platformBilling, 'Plan is not set')

        const subscriptionId = platformBilling.stripeSubscriptionId
        if (isNil(subscriptionId)) {
            return
        }

        const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const item = subscription.items.data.find((item) => item.price.id === AI_CREDITS_PRICE_ID)
        if (isNil(item)) {
            return
        }

        await stripe.billing.meterEvents.create({
            event_name: 'ai_credits',
            payload: {
                value: overage.toString(),
                stripe_customer_id: subscription.customer as string,
            },
        })
    })


    systemJobHandlers.registerJobHandler(SystemJobName.SEVEN_DAYS_IN_TRIAL, async (data) => {
        const log = app.log
        const { platformId,  email } = data
        await handleEmailReminder(log, platformId, email, '7-days-in-trial')
    })


    systemJobHandlers.registerJobHandler(SystemJobName.ONE_DAY_LEFT_ON_TRIAL, async (data) => {
        const log = app.log
        const { platformId,  email } = data
        await handleEmailReminder(log, platformId, email, '1-day-left-on-trial')
    })

    await app.register(platformPlanController, { prefix: '/v1/platform-billing' })
    await app.register(stripeBillingController, { prefix: '/v1/stripe-billing' })
}


async function handleEmailReminder(log: FastifyBaseLogger, platformId: string, customerEmail: string, templateName: '1-day-left-on-trial' | '7-days-in-trial') {
    const stripe = stripeHelper(log).getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')


    const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
    if (isNil(platformBilling.stripeSubscriptionId)) {
        log.error(`No stripe subscription id found for platform, ${platformId}`)
        return
    }

    const subscription = await stripe.subscriptions.retrieve(platformBilling.stripeSubscriptionId as string)

    if (isNil(subscription) || isNil(subscription.trial_end)) {
        return
    }


    const user = await userIdentityService(log).getIdentityByEmail(customerEmail)
    await emailService(log).sendTrialReminder({
        platformId,
        firstName: user?.firstName,
        customerEmail,
        templateName,
    })
    log.info(`Sent ${templateName} email for platfrom, ${platformId}`)
}