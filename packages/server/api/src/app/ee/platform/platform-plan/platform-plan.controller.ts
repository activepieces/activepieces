import { assertNotNullOrUndefined, isNil } from '@activepieces/core-utils'
import { AiCreditsAutoTopUpState, CheckoutPlanParamsSchema, CheckoutSessionResponse, CreateAICreditCheckoutSessionParamsSchema, CreateCheckoutSessionParamsSchema, CreditType, PlatformBillingInformation, PrincipalType, PurchasablePlan, STANDARD_CLOUD_PLAN, UpdateActiveFlowsAddonParamsSchema, UpdateAICreditsAutoTopUpParamsSchema } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { billingProvider } from '../../../platform/billing-provider'
import { platformService } from '../../../platform/platform.service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const platformPlanController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.get('/info', InfoRequest, async (request) => {
        const platform = await platformService(request.log).getOneOrThrow(request.principal.platform.id)
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

    fastify.get('/plans', ListPlansRequest, async (request) => {
        return billingProvider.get(request.log).listPlans(request.principal.platform.id)
    })

    fastify.post('/checkout', CheckoutRequest, async (request) => {
        return billingProvider.get(request.log).createCheckoutSession({
            platformId: request.principal.platform.id,
            planId: request.body.planId,
        })
    })

    fastify.post('/portal', {
        config: {
            security: securityAccess.platformAdminOnly([PrincipalType.USER]),
        },
    }, async (request) => {
        const { url } = await billingProvider.get(request.log).getBillingPortalUrl({ platformId: request.principal.platform.id })
        return url
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

    // Consumable top-ups (apCredits today; appSumoAiCredits + future users/activeFlows/projects via creditType).
    fastify.post('/ai-credits/create-checkout-session', CreateAICreditCheckoutSessionRequest, async (request) => {
        const { credits, creditType } = request.body
        const { checkoutUrl } = await billingProvider.get(request.log).topUpFeature({
            platformId: request.principal.platform.id,
            featureId: creditType ?? CreditType.enum.apCredits,
            quantity: credits,
        })
        return { stripeCheckoutUrl: checkoutUrl }
    })
    fastify.post('/ai-credits/auto-topup', UpdateAICreditsAutoTopUpRequest, async (request) => {
        const body = request.body
        const enabled = body.state === AiCreditsAutoTopUpState.ENABLED
        const { setupPaymentUrl } = await billingProvider.get(request.log).configureAutoTopUp({
            platformId: request.principal.platform.id,
            featureId: body.creditType ?? CreditType.enum.apCredits,
            enabled,
            threshold: enabled ? body.minThreshold : 0,
            quantity: enabled ? body.creditsToAdd : 0,
            maxMonthlyTopUps: enabled && !isNil(body.maxMonthlyLimit) ? Math.floor(body.maxMonthlyLimit / body.creditsToAdd) : null,
        })
        return { stripeCheckoutUrl: setupPaymentUrl }
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

const ListPlansRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: z.array(PurchasablePlan),
        },
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const CheckoutRequest = {
    schema: {
        body: CheckoutPlanParamsSchema,
        response: {
            [StatusCodes.OK]: CheckoutSessionResponse,
        },
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const CreateAICreditCheckoutSessionRequest = {
    schema: {
        body: CreateAICreditCheckoutSessionParamsSchema,
        response: {
            [StatusCodes.OK]: z.object({
                stripeCheckoutUrl: z.string().nullable(),
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
        [StatusCodes.OK]: z.object({
            stripeCheckoutUrl: z.string().optional(),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
