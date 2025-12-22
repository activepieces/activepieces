import { CreateAICreditCheckoutSessionParamsSchema, CreateCheckoutSessionParamsSchema, EnableAICreditsAutoTopUpParamsSchema, ListAICreditsPaymentsRequestParams, STANDARD_CLOUD_PLAN, UpdateActiveFlowsAddonParamsSchema } from '@activepieces/ee-shared'
import { assertNotNullOrUndefined, PlatformBillingInformation, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const platformPlanController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

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
            allowedPrincipals: [PrincipalType.USER] as const,
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
    fastify.post('/ai-credits/auto-topup/enable', EnableAICreditsAutoTopUpRequest, async (request) => {
        return platformAiCreditsService(request.log).enableAutoTopUp(request.principal.platform.id, request.body)
    })
    fastify.post('/ai-credits/auto-topup/config', EnableAICreditsAutoTopUpRequest, async (request) => {
        return platformAiCreditsService(request.log).updateAutoTopUpConfig(request.principal.platform.id, request.body)
    })
    fastify.post('/ai-credits/auto-topup/disable', DisableAICreditsAutoTopUpRequest, async (request) => {
        return platformAiCreditsService(request.log).disableAutoTopUp(request.principal.platform.id)
    })
    fastify.get('/ai-credits/payments', ListAICreditsPaymentsRequest, async (request) => {
        return platformAiCreditsService(request.log).listPayments(request.principal.platform.id, request.query)
    })
}

const InfoRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
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
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const CreateCheckoutSessionRequest = {
    schema: {
        body: CreateCheckoutSessionParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
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
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const EnableAICreditsAutoTopUpRequest = {
    schema: {
        body: EnableAICreditsAutoTopUpParamsSchema,
        [StatusCodes.OK]: Type.Object({
            stripeCheckoutUrl: Type.Optional(Type.String()),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const DisableAICreditsAutoTopUpRequest = {
    schema: {},
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const ListAICreditsPaymentsRequest = {
    schema: {
        querystring: ListAICreditsPaymentsRequestParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}