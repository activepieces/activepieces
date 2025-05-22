import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { BillingEntityType, usageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const platformPlanController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    fastify.get('/info', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
    }, async (request: FastifyRequest) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        const { tasks, aiTokens } = await usageService(request.log).getUsageForBillingPeriod(platform.id, BillingEntityType.PLATFORM)
        return {
            subscription: await platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            nextBillingDate: usageService(request.log).getCurrentBillingPeriodEnd(),
            flowRunCount: tasks,
            aiTokens,
        }
    })

    fastify.post('/portal', {}, async (request) => {
        return {
            portalLink: await stripeHelper(request.log).createPortalSessionUrl({ platformId: request.principal.platform.id }),
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
            const projectBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
            const customerId = projectBilling.stripeCustomerId
            assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')
            if (projectBilling.stripeSubscriptionStatus === ApSubscriptionStatus.ACTIVE) {
                await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Already subscribed',
                })
                return
            }

            await platformPlanService(request.log).update({ platformId: request.principal.platform.id, tasksLimit: DEFAULT_FREE_PLAN_LIMIT.tasks })
            return {
                paymentLink: await stripeHelper(request.log).createCheckoutUrl(customerId),
            }
        },
    )

    fastify.patch(
        '/',
        {
            schema: {
                body: Type.Object({
                    tasksLimit: Type.Optional(Type.Number()),
                }),
            },
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(platformId)
            if (platformBilling.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'Platform does not have an active subscription',
                    },
                })
            }
            return platformPlanService(request.log).update({ platformId, tasksLimit: request.body.tasksLimit })
        },
    )
}
