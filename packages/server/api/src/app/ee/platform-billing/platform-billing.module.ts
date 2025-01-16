import { ApSubscriptionStatus } from '@activepieces/ee-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import Stripe from 'stripe'
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { platformBillingController } from './platform-billing.controller'
import { platformBillingService } from './platform-billing.service'
import { stripeHelper, TASKS_PAYG_PRICE_ID } from './stripe-helper'
import { BillingEntityType, usageService } from './usage/usage-service'

const EVERY_4_HOURS = '59 */4 * * *'

export const platformBillingModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    systemJobHandlers.registerJobHandler(SystemJobName.PLATFORM_USAGE_REPORT, async () => {
        const log = app.log
        log.info('Running platform-daily-report')

        const startOfDay = dayjs().startOf('day').toISOString()
        const endOfDay = dayjs().endOf('day').toISOString()
        const currentTimestamp = dayjs().unix()

        const platforms = await flowRunRepo().createQueryBuilder('flowRun')
            .select('DISTINCT platform.id', 'platformId')
            .innerJoin('flowRun.project', 'project')
            .innerJoin('project.platform', 'platform')
            .where({
                created: MoreThanOrEqual(startOfDay),
            }).andWhere({
                created: LessThanOrEqual(endOfDay),
            })
            .getRawMany()

        log.info(`Found ${platforms.length} platforms with usage in the current day`)
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        for (const { platformId } of platforms) {
            const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
            if (isNil(platformBilling.stripeSubscriptionId) || platformBilling.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
                continue
            }

            const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(platformBilling.stripeSubscriptionId)
            const item = subscription.items.data.find((item) => item.price.id === TASKS_PAYG_PRICE_ID)
            assertNotNullOrUndefined(item, 'No item found for tasks')

            const { tasks, aiTokens } = await usageService(log).getUsageForBillingPeriod(platformId, BillingEntityType.PLATFORM)

            log.info({ platformId, tasks, aiTokens, includedTasks: platformBilling.tasksLimit }, 'Sending usage record to stripe')
            
            await stripe.subscriptionItems.createUsageRecord(item.id, {
                quantity: Math.max(tasks - (platformBilling.tasksLimit || 0), 0),
                timestamp: currentTimestamp,
                action: 'set',
            })
        }
        log.info('Finished platform-daily-report')
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.PLATFORM_USAGE_REPORT,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: EVERY_4_HOURS,
        },
    })
    await app.register(platformBillingController, { prefix: '/v1/platform-billing' })
}
