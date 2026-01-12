import { CreateAICreditCheckoutSessionParamsSchema, CreateCheckoutSessionParamsSchema, STANDARD_CLOUD_PLAN, UpdateActiveFlowsAddonParamsSchema, UpdateAICreditsAutoTopUpParamsSchema } from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const platformPlanController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/info', InfoRequest, async (request) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        const [platformPlan, usage] = await Promise.all([
            platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            platformPlanService(request.log).getUsage(platform.id),
        ])

        const { stripeSubscriptionCancelDate: cancelDate } = platformPlan
        const { endDate: nextBillingDate } = await platformPlanService(request.log).getBillingDates(platformPlan)

        const nextBillingAmount = await platformPlanService(request.log).getNextBillingAmount({ subscriptionId: platformPlan.stripeSubscriptionId })

        const response: PlatformBillingInformation = {
            plan: platformPlan,
            usage,
            nextBillingAmount,
            nextBillingDate,
            cancelAt: cancelDate,
        }
        return response
    })

    fastify.post('/portal', {
        config: {
            security: securityAccess.platformAdminOnly([PrincipalType.USER]),
        },
    }, async (request) => {
        return stripeHelper(request.log).createPortalSessionUrl(request.principal.platform.id)
    })

    fastify.post('/create-checkout-session', CreateCheckoutSessionRequest, async (request) => {
        const { stripeCustomerId: customerId, ...platformPlan } = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { newActiveFlowsLimit } = request.body

        const baseActiveFlowsLimit = STANDARD_CLOUD_PLAN.activeFlowsLimit ?? 0
        const extraActiveFlows = Math.max(0, newActiveFlowsLimit - baseActiveFlowsLimit)

        return stripeHelper(request.log).createNewSubscriptionCheckoutSession({
            platformId: platformPlan.platformId,
            customerId,
            extraActiveFlows,
        })
    })

    fastify.post('/update-active-flows-addon', UpdateActiveFlowsAddonRequest, async (request) => {
        const { stripeCustomerId: customerId, ...platformPlan } = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { newActiveFlowsLimit } = request.body

        const baseActiveFlowsLimit = STANDARD_CLOUD_PLAN.activeFlowsLimit ?? 0
        const currentActiveFlowsLimit =  platformPlan.activeFlowsLimit ?? 0
        const extraActiveFlows = Math.max(0, newActiveFlowsLimit - baseActiveFlowsLimit)
        const isFreeDowngrade = newActiveFlowsLimit === baseActiveFlowsLimit

        assertNotNullOrUndefined(platformPlan.stripeSubscriptionId, 'Subscription doesnt exist')

        const isUpgrade = newActiveFlowsLimit > currentActiveFlowsLimit
        return stripeHelper(request.log).handleSubscriptionUpdate({
            subscriptionId: platformPlan.stripeSubscriptionId,
            extraActiveFlows,
            isUpgrade, 
            isFreeDowngrade,
        })
    })

    // AI Credits
    fastify.post('/ai-credits/create-checkout-session', CreateAICreditCheckoutSessionRequest, async (request) => {
        return platformAiCreditsService(request.log).initializeStripeAiCreditsPayment(request.principal.platform.id, request.body)
    })
    fastify.post('/ai-credits/auto-topup', UpdateAICreditsAutoTopUpRequest, async (request) => {
        return platformAiCreditsService(request.log).updateAutoTopUp(request.principal.platform.id, request.body)
    })
}

const InfoRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    response: {
        [StatusCodes.OK]: PlatformBillingInformation,
    },
}

const UpdateActiveFlowsAddonRequest = {
    schema: {
        body: UpdateActiveFlowsAddonParamsSchema,
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const CreateCheckoutSessionRequest = {
    schema: {
        body: CreateCheckoutSessionParamsSchema,
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const CreateAICreditCheckoutSessionRequest = {
    schema: {
        body: CreateAICreditCheckoutSessionParamsSchema,
        response: {
            [StatusCodes.OK]: Type.Object({
                stripeCheckoutUrl: Type.String(),
            }),
        },
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const UpdateAICreditsAutoTopUpRequest = {
    schema: {
        body: UpdateAICreditsAutoTopUpParamsSchema,
        [StatusCodes.OK]: Type.Object({
            stripeCheckoutUrl: Type.Optional(Type.String()),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
