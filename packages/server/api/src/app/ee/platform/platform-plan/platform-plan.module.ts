import { ApSubscriptionStatus } from '@activepieces/ee-shared'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import Stripe from 'stripe'
import { systemJobsSchedule } from '../../../helper/system-jobs'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { projectRepo } from '../../../project/project-service'
import { BillingEntityType, platformUsageService } from '../platform-usage-service'
import { platformPlanController } from './platform-plan.controller'
import { platformPlanService } from './platform-plan.service'
import { stripeBillingController } from './stripe-billing.controller'
import { stripeHelper, TASKS_PAYG_PRICE_ID } from './stripe-helper'

const EVERY_4_HOURS = '59 */4 * * *'

export const platformPlanModule: FastifyPluginAsyncTypebox = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.PLATFORM_USAGE_REPORT, async () => {
        const log = app.log
        log.info('Running platform-daily-report')

        const startOfDay = dayjs().startOf('day').toISOString()
        const endOfDay = dayjs().endOf('day').toISOString()
        const currentTimestamp = dayjs().unix()
        const platforms: { platformId: string }[] = await projectRepo().createQueryBuilder('project')
            .select('DISTINCT "project"."platformId"', 'platformId')
            .where(`"project"."id" IN (
            SELECT DISTINCT "flowRun"."projectId" 
            FROM "flow_run" "flowRun"
            WHERE "flowRun"."created" >= :startDate
            AND "flowRun"."created" <= :endDate
        )`, { startDate: startOfDay, endDate: endOfDay })
            .getRawMany()
        log.info({ platformCount: platforms.length }, 'Found platforms with usage in the current day')
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')

        for (const { platformId } of platforms) {
            const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
            if (isNil(platformBilling.stripeSubscriptionId) || platformBilling.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
                continue
            }

            const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(platformBilling.stripeSubscriptionId)
            const item = subscription.items.data.find((item) => item.price.id === TASKS_PAYG_PRICE_ID)
            assertNotNullOrUndefined(item, 'No item found for tasks')

            const { tasks, aiCredits } = await platformUsageService(log).getTaskAndCreditUsage(platformId, BillingEntityType.PLATFORM)

            log.info({ platformId, tasks, aiCredits, includedTasks: platformBilling.includedTasks }, 'Sending usage record to stripe')

            await stripe.subscriptionItems.createUsageRecord(item.id, {
                quantity: Math.max(tasks - (platformBilling.includedTasks || 0), 0),
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
    await app.register(platformPlanController, { prefix: '/v1/platform-billing' })
    await app.register(stripeBillingController, { prefix: '/v1/stripe-billing' })
}
