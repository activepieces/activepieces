import { AdminAddPlatformRequestBody, AdminRetryRunsRequestBody, ApEdition, isNil, assertNotNullOrUndefined, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { adminPlatformService } from './admin-platform.service'
import { BillingEntityType } from '../platform-billing/usage/usage-service'
import { ApSubscriptionStatus } from '@activepieces/ee-shared'
import { platformBillingService } from '../platform-billing/platform-billing.service'
import { usageService } from '../platform-billing/usage/usage-service'
import { projectRepo } from '../../project/project-service'
import dayjs from 'dayjs'
import { stripeHelper, TASKS_PAYG_PRICE_ID } from '../platform-billing/stripe-helper'
import Stripe from 'stripe'
import { FastifyInstance } from 'fastify'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {

        app.post('/', async (req, res) => {
            printBillingRecords(app).catch(err => {
                app.log.error(err)
            })
            return res.status(StatusCodes.OK).send()
        })
    }
    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })
}

async function printBillingRecords(app: FastifyInstance) {
    const log = app.log
    log.info('Running platform-daily-report')

    const startOfDay = dayjs('2025-03-01').startOf('day').toISOString()
    const endOfDay = dayjs('2025-03-31').endOf('day').toISOString()
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
        const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
        if (isNil(platformBilling.stripeSubscriptionId) || platformBilling.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
            continue
        }

        const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(platformBilling.stripeSubscriptionId)
        const item = subscription.items.data.find((item) => item.price.id === TASKS_PAYG_PRICE_ID)
        assertNotNullOrUndefined(item, 'No item found for tasks')

        const { tasks, aiTokens } = await usageService(log).getUsageForBillingPeriod(platformId, BillingEntityType.PLATFORM)

        log.info({ platformId, tasks, aiTokens, includedTasks: platformBilling.includedTasks }, 'new usage record')

        const quantity = Math.max(tasks - (platformBilling.includedTasks || 0), 0)
        if (quantity > 0) {
            log.info({ platformId, quantity }, 'Billing record')
        }
    }
}
const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}



const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
