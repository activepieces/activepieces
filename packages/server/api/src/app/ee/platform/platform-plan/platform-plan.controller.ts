import { ApSubscriptionStatus, BilingCycle, PaymentTiming, PlanName, ProrationBehavior, UpgradeSubscriptionParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const platformPlanController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    fastify.get('/info', InfoRequest, async (request: FastifyRequest) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        const response: PlatformBillingInformation = {
            plan: await platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            usage: await platformUsageService(request.log).getPlatformUsage(platform.id),
            nextBillingDate: platformUsageService(request.log).getCurrentBillingPeriodEnd(),
        }
        return response
    })

    fastify.post('/portal', {}, async (request) => {
        return {
            portalLink: await stripeHelper(request.log).createPortalSessionUrl({ platformId: request.principal.platform.id }),
        }
    })

    fastify.post('/upgrade', UpgradeRequest, async (request, reply) => {
        const stripe = stripeHelper(request.log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
   
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan, billing, addons, paymentTiming, prorationBehavior } = request.body

        if (!plan || ![PlanName.PLUS, PlanName.BUSINESS].includes(plan)) {
            await reply.status(StatusCodes.BAD_REQUEST).send({
                message: 'Invalid plan selected. Choose PLUS or BUSINESS.',
            })
            return
        }

        if (!billing || ![BilingCycle.MONTHLY, BilingCycle.ANNUAL].includes(billing)) {
            await reply.status(StatusCodes.BAD_REQUEST).send({
                message: 'Invalid billing period. Choose MONTHLY or ANNUAL.',
            })
            return
        }

        const upgradeParams = {
            plan,
            billing,
            addons: addons || {},
            paymentTiming: paymentTiming || PaymentTiming.IMMEDIATE,
            prorationBehavior: prorationBehavior || ProrationBehavior.CREATE_PRORATIONS,
        }

        try {
            if (platformBilling.stripeSubscriptionStatus === ApSubscriptionStatus.ACTIVE && platformBilling.stripeSubscriptionId) {
                request.log.info({ 
                    platformId: request.principal.platform.id, 
                    subscriptionId: platformBilling.stripeSubscriptionId,
                    upgradeParams, 
                }, 'Upgrading existing subscription')

                const updatedSubscription = await stripeHelper(request.log).upgradeSubscription(
                    platformBilling.stripeSubscriptionId,
                    upgradeParams,
                )

                const planLimits = platformPlanService(request.log).getPlanLimits(plan, addons)

                await platformPlanService(request.log).update({ 
                    platformId: request.principal.platform.id, 
                    ...planLimits,
                })

                return {
                    subscription: {
                        id: updatedSubscription.id,
                        status: updatedSubscription.status,
                        current_period_end: updatedSubscription.current_period_end,
                        plan,
                        billing,
                        addons,
                    },
                }
            }
            else {
                request.log.info({ 
                    platformId: request.principal.platform.id, 
                    customerId,
                    upgradeParams, 
                }, 'Creating new subscription')

                const checkoutUrl = await stripeHelper(request.log).createSubscriptionCheckoutUrl(
                    customerId,
                    upgradeParams,
                )

                return {
                    paymentLink: checkoutUrl,
                }
            }
        }
        catch (error) {
            request.log.error({ error, platformId: request.principal.platform.id }, 'Failed to upgrade subscription')
            
            await reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: 'Failed to process subscription upgrade. Please try again.',
                error: error instanceof Error ? error.message : 'Unknown error',
            })
            return
        }
    })

    fastify.patch('/', UpdateLimitsRequest, async (request) => {
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
    })
}

const InfoRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    resposne: {
        [StatusCodes.OK]: PlatformBillingInformation,
    },
}

const UpdateLimitsRequest = {
    schema: {
        body: Type.Object({
            tasksLimit: Type.Optional(Type.Number()),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const UpgradeRequest = {
    schema: {
        body: UpgradeSubscriptionParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
