import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, FlowRun, isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { FlowRunEntity } from '../../../flows/flow-run/flow-run-entity'
import { systemJobsSchedule } from '../../../helper/system-jobs'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { BillingEntityType, usageService } from '../../platform-billing/usage/usage-service'
import { projectLimitsService } from '../../project-plan/project-plan.service'
import { projectBillingService } from './project-billing.service'
import { stripeHelper, stripeWebhookSecret, TASKS_PAYG_PRICE_ID } from './stripe-helper'

const flowRunRepo = repoFactory<FlowRun>(FlowRunEntity)

const EVERY_4_HOURS = '59 */4 * * *'

export const projectBillingModule: FastifyPluginAsyncTypebox = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.PROJECT_USAGE_REPORT, async () => {
        const log = app.log
        log.info('Running project-daily-report')

        const startOfDay = dayjs().startOf('day').toISOString()
        const endOfDay = dayjs().endOf('day').toISOString()
        const currentTimestamp = dayjs().unix()
        const projectIds = await flowRunRepo().createQueryBuilder('flowRun')
            .select('DISTINCT "projectId"')
            .where({
                created: MoreThanOrEqual(startOfDay),
            }).andWhere({
                created: LessThanOrEqual(endOfDay),
            })
            .getRawMany()
        log.info(`Found ${projectIds.length} projects with usage in the current day`)
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        for (const { projectId } of projectIds) {
            const projectBilling = await projectBillingService(log).getOrCreateForProject(projectId)
            if (isNil(projectBilling.stripeSubscriptionId) || projectBilling.subscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
                continue
            }
            const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(projectBilling.stripeSubscriptionId)
            const item = subscription.items.data.find((item) => item.price.id === TASKS_PAYG_PRICE_ID)
            assertNotNullOrUndefined(item, 'No item found for tasks')
            const usage = await usageService(log).getUsageForBillingPeriod(projectId, BillingEntityType.PROJECT)
            log.info({ projectId, tasks: usage.tasks, includedTasks: projectBilling.includedTasks }, 'Sending usage record to stripe')
            await stripe.subscriptionItems.createUsageRecord(item.id, {
                quantity: Math.max(usage.tasks - projectBilling.includedTasks, 0),
                timestamp: currentTimestamp,
                action: 'set',
            })
        }
        log.info('Finished project-daily-report')
    })
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.PROJECT_USAGE_REPORT,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: EVERY_4_HOURS,
        },
    })
    await app.register(projectBillingController, { prefix: '/v1/project-billing' })
}

const projectBillingController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
    }, async (request) => {
        return {
            subscription: await projectBillingService(request.log).getOrCreateForProject(request.principal.projectId),
            nextBillingDate: usageService(request.log).getCurrentBillingPeriodEnd(),
        }
    })

    fastify.post('/portal', {}, async (request) => {
        return {
            portalLink: await stripeHelper(request.log).createPortalSessionUrl(request.principal.projectId),
        }
    })

    fastify.post(
        '/upgrade',
        {
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
        },
        async (request, reply) => {
            const stripe = stripeHelper(request.log).getStripe()
            assertNotNullOrUndefined(stripe, 'Stripe is not configured')
            const projectBilling = await projectBillingService(request.log).getOrCreateForProject(request.principal.projectId)
            if (projectBilling.subscriptionStatus === ApSubscriptionStatus.ACTIVE) {
                await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Already subscribed',
                })
                return
            }
            return {
                paymentLink: await stripeHelper(request.log).createCheckoutUrl(projectBilling.stripeCustomerId),
            }
        },
    )

    fastify.post(
        '/stripe/webhook',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
                rawBody: true,
            },
        },
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string
                const stripe = stripeHelper(request.log).getStripe()
                assertNotNullOrUndefined(stripe, 'Stripe is not configured')
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    stripeWebhookSecret,
                )
                const subscription = webhook.data.object as Stripe.Subscription
                if (!stripeHelper(request.log).isPriceForTasks(subscription)) {
                    return {
                        message: 'Subscription does not have a price for tasks',
                    }
                }
                const projectBilling = await projectBillingService(request.log).updateSubscriptionIdByCustomerId(subscription)
                if (subscription.status === ApSubscriptionStatus.CANCELED) {
                    request.log.info(`Subscription canceled for project ${projectBilling.projectId}, downgrading to free plan`)
                    await projectLimitsService.upsert(DEFAULT_FREE_PLAN_LIMIT, projectBilling.projectId)
                }
                return await reply.status(StatusCodes.OK).send()
            }
            catch (err) {
                request.log.error(err)
                request.log.warn('⚠️  Webhook signature verification failed.')
                exceptionHandler.handle(err, request.log)
                return reply
                    .status(StatusCodes.BAD_REQUEST)
                    .send('Invalid webhook signature')
            }
        },
    )
}
