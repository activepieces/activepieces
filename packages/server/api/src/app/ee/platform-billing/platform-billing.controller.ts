import { ApSubscriptionStatus } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { platformService } from '../../platform/platform.service'
import { platformBillingService } from './platform-billing.service'
 
import { stripeHelper, stripeWebhookSecret } from './stripe-helper'
import { BillingEntityType, usageService } from './usage/usage-service'

export const platformBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/info', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
    }, async (request: FastifyRequest) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        const { tasks, aiTokens } = await usageService(request.log).getUsageForBillingPeriod(platform.id, BillingEntityType.PLATFORM)
        return {
            subscription: await platformBillingService(request.log).getOrCreateForPlatform(platform.id),
            nextBillingDate: usageService(request.log).getCurrentBillingPeriodEnd(),
            flowRunCount: tasks,
            aiTokens,
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
            const projectBilling = await platformBillingService(request.log).getOrCreateForPlatform(request.principal.platform.id)
            if (projectBilling.stripeSubscriptionStatus === ApSubscriptionStatus.ACTIVE) {
                await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Already subscribed',
                })
                return
            }
            await platformBillingService(request.log).update(request.principal.platform.id, undefined, undefined)
            return {
                paymentLink: await stripeHelper(request.log).createCheckoutUrl(projectBilling.stripeCustomerId),
            }
        },
    )

    fastify.patch(
        '/',
        {
            schema: {
                body: Type.Object({
                    tasksLimit: Type.Optional(Type.Number()),
                    aiCreditsLimit: Type.Optional(Type.Number()),
                }),
            },
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            return platformBillingService(request.log).update(platformId, request.body.tasksLimit, request.body.aiCreditsLimit)
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
                const platformBilling = await platformBillingService(request.log).updateSubscriptionIdByCustomerId(subscription)
                if (subscription.status === ApSubscriptionStatus.CANCELED) {
                    request.log.info(`Subscription canceled for project ${platformBilling.platformId}, downgrading to free plan`)
                    await platformBillingService(request.log).update(platformBilling.platformId, 0, 0)
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
