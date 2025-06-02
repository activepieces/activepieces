import { PlanName, UpdateSubscriptionParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
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

    fastify.post('/create-subscription', UpgradeRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan, extraUsers } = request.body

        if (plan !== PlanName.BUSINESS &&  !isNil(extraUsers) && extraUsers > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Extra users are only available for business plan',
                },
            })
        }

        return stripeHelper(request.log).createSubscriptionCheckoutUrl(
            customerId,
            { plan, extraUsers },
        )

    })

    fastify.post('/update-subscription', UpgradeRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan, extraUsers } = request.body

        if (plan !== PlanName.BUSINESS &&  !isNil(extraUsers) && extraUsers > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Extra users are only available for business plan',
                },
            })
        }

        assertNotNullOrUndefined(platformBilling.stripeSubscriptionId, 'Stripe subscription id is not set')
        await stripeHelper(request.log).updateSubscription(
            platformBilling.stripeSubscriptionId,
            { plan, extraUsers },
        )

        request.log.info(`${plan} subscription updated for platform ${platformBilling.platformId}`)
        const planLimits = platformPlanService(request.log).getPlanLimits(plan)
        if (plan === PlanName.BUSINESS && !isNil(extraUsers) && Number(extraUsers) > 0) {
            planLimits.userSeatsLimit = (planLimits.userSeatsLimit ?? 0) + Number(extraUsers)
        }

        const platformId = platformBilling.platformId
        const platformPlan = await platformPlanService(request.log).update({ 
            platformId,
            ...planLimits,
        })

        return platformPlan
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
        body: UpdateSubscriptionParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
