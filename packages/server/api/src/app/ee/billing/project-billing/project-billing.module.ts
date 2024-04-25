import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { databaseConnection } from '../../../database/database-connection'
import { FlowRunEntity } from '../../../flows/flow-run/flow-run-entity'
import { systemJobsSchedule } from '../../../helper/system-jobs'
import { projectService } from '../../../project/project-service'
import { projectUsageService } from '../../../project/usage/project-usage-service'
import { projectLimitsService } from '../../project-plan/project-plan.service'
import { projectBillingService } from './project-billing.service'
import { stripeHelper, stripeWebhookSecret, TASKS_PAYG_PRICE_ID } from './stripe-helper'
import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { exceptionHandler, logger } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, FlowRun, isNil, PrincipalType } from '@activepieces/shared'

const flowRunRepo =
    databaseConnection.getRepository<FlowRun>(FlowRunEntity)

const EVERY_4_HOURS = '59 */4 * * *'

export const projectBillingModule: FastifyPluginAsyncTypebox = async (app) => {
    await systemJobsSchedule.upsertJob({
        job: {
            name: 'project-usage-report',
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: EVERY_4_HOURS,
        },
        async handler(job) {
            await sendProjectRecords(job.timestamp)
        },
    })
    await app.register(projectBillingController, { prefix: '/v1/project-billing' })
}

async function sendProjectRecords(timestamp: number): Promise<void> {
    logger.info('Running project-daily-report')

    const startOfDay = dayjs(timestamp).startOf('day').toISOString()
    const endOfDay = dayjs(timestamp).endOf('day').toISOString()
    const projectIds = await flowRunRepo.createQueryBuilder('flowRun')
        .select('DISTINCT "projectId"')
        .where({
            created: MoreThanOrEqual(startOfDay),
        }).andWhere({
            created: LessThanOrEqual(endOfDay),
        })
        .getRawMany()
    logger.info(`Found ${projectIds.length} projects with usage in the current day`)
    const stripe = stripeHelper.getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    for (const { projectId } of projectIds) {
        const projectBilling = await projectBillingService.getOrCreateForProject(projectId)
        if (isNil(projectBilling.stripeSubscriptionId) || projectBilling.subscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
            continue
        }
        const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(projectBilling.stripeSubscriptionId)
        const item = subscription.items.data.find((item) => item.price.id === TASKS_PAYG_PRICE_ID)
        assertNotNullOrUndefined(item, 'No item found for tasks')
        const project = await projectService.getOneOrThrow(projectId)
        const billingPeriod = projectUsageService.getCurrentingStartPeriod(project.created)
        const usage = await projectUsageService.getUsageForBillingPeriod(projectId, billingPeriod)
        logger.info({ projectId, tasks: usage.tasks, includedTasks: projectBilling.includedTasks }, 'Sending usage record to stripe')
        await stripe.subscriptionItems.createUsageRecord(item.id, {
            quantity: Math.max(usage.tasks - projectBilling.includedTasks, 0),
            timestamp: dayjs(timestamp).unix(),
            action: 'set',
        })
    }
    logger.info('Finished project-daily-report')
}
const projectBillingController: FastifyPluginAsyncTypebox = async (fastify) => {


    fastify.get('/', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
    }, async (request) => {
        const project = await projectService.getOneOrThrow(request.principal.projectId)
        return {
            subscription: await projectBillingService.getOrCreateForProject(request.principal.projectId),
            nextBillingDate: projectUsageService.getCurrentingEndPeriod(project.created),
        }
    })

    fastify.post('/portal', {}, async (request) => {
        return {
            portalLink: await stripeHelper.createPortalSessionUrl(request.principal.projectId),
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
            const stripe = stripeHelper.getStripe()
            assertNotNullOrUndefined(stripe, 'Stripe is not configured')
            const projectBilling = await projectBillingService.getOrCreateForProject(request.principal.projectId)
            if (projectBilling.subscriptionStatus === ApSubscriptionStatus.ACTIVE) {
                await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Already subscribed',
                })
                return
            }
            return {
                paymentLink: await stripeHelper.createCheckoutUrl(request.principal.projectId, projectBilling.stripeCustomerId),
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
                const stripe = stripeHelper.getStripe()
                assertNotNullOrUndefined(stripe, 'Stripe is not configured')
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    stripeWebhookSecret,
                )
                const subscription = webhook.data.object as Stripe.Subscription
                if (!stripeHelper.isPriceForTasks(subscription)) {
                    return {
                        message: 'Subscription does not have a price for tasks',
                    }
                }
                const projectBilling = await projectBillingService.updateSubscriptionIdByCustomerId(subscription)
                if (subscription.status === ApSubscriptionStatus.CANCELED) {
                    logger.info(`Subscription canceled for project ${projectBilling.projectId}, downgrading to free plan`)
                    await projectLimitsService.upsert(DEFAULT_FREE_PLAN_LIMIT, projectBilling.projectId)
                }
                return await reply.status(StatusCodes.OK).send()
            }
            catch (err) {
                logger.error(err)
                logger.warn('⚠️  Webhook signature verification failed.')
                exceptionHandler.handle(err)
                return reply
                    .status(StatusCodes.BAD_REQUEST)
                    .send('Invalid webhook signature')
            }
        },
    )

}

