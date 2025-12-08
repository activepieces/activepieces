import { CreateCheckoutSessionParamsSchema, SetAiCreditsOverageLimitParamsSchema, STANDARD_CLOUD_PLAN, ToggleAiCreditsOverageEnabledParamsSchema, UpdateActiveFlowsAddonParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, AiOverageState, assertNotNullOrUndefined, ErrorCode, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
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

    fastify.post('/update-ai-overage-state', EnableAiCreditsOverageRequest, async (request) => {
        const platformId = request.principal.platform.id
        const { state } = request.body
        
        const [usage, platformPlan] = await Promise.all([
            platformPlanService(request.log).getUsage(platformId),
            platformPlanService(request.log).getOrCreateForPlatform(platformId),
        ])

        if (platformPlan.aiCreditsOverageState === AiOverageState.NOT_ALLOWED) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'AI credit overage isn\'t available for your plan',
                },
            })
        }
        
        const totalCreditsUsed = usage.aiCredits
        const planIncludedCredits = platformPlan.includedAiCredits || 0
        const overageCreditsUsed = Math.max(0, totalCreditsUsed - planIncludedCredits)
        
        if (state === AiOverageState.ALLOWED_BUT_OFF && overageCreditsUsed > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Cannot disable usage-based billing while you have ${overageCreditsUsed.toLocaleString()} overage credits used.`,
                },
            })
        }
        
        request.log.info({
            platformId,
            currentUsage: {
                total: totalCreditsUsed,
                planCredits: Math.min(totalCreditsUsed, planIncludedCredits),
                overageCredits: overageCreditsUsed,
            },
        }, 'Updating AI credits overage state')
        
        const newOverageLimit = state === AiOverageState.ALLOWED_AND_ON 
            ? (platformPlan.aiCreditsOverageLimit || 500)
            : platformPlan.aiCreditsOverageLimit
        
        return platformPlanService(request.log).update({
            platformId,
            aiCreditsOverageState: state,
            aiCreditsOverageLimit: newOverageLimit,
        })
    })

    fastify.post('/set-ai-credits-overage-limit', SetAiCreditsOverageLimitRequest, async (request) => {
        const platformId = request.principal.platform.id
        const { limit } = request.body
        
        const [usage, platformPlan] = await Promise.all([
            platformPlanService(request.log).getUsage(platformId),
            platformPlanService(request.log).getOrCreateForPlatform(platformId),
        ])
        
        if (platformPlan.aiCreditsOverageState !== AiOverageState.ALLOWED_AND_ON) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Setting AI credits overage limit is not allowed while overage is not enabled',
                },
            })
        }
        
        const totalCreditsUsed = usage.aiCredits
        const planIncludedCredits = platformPlan.includedAiCredits || 0
        const overageCreditsUsed = Math.max(0, totalCreditsUsed - planIncludedCredits)
        
        if (overageCreditsUsed > limit) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Cannot set usage limit to ${limit.toLocaleString()} credits as you have already used ${overageCreditsUsed.toLocaleString()} overage credits this billing period.`,
                },
            })
        }
        
        request.log.info({
            platformId,
            previousLimit: platformPlan.aiCreditsOverageLimit,
            newLimit: limit,
            currentUsage: {
                total: totalCreditsUsed,
                planCredits: Math.min(totalCreditsUsed, planIncludedCredits),
                overageCredits: overageCreditsUsed,
            },
        }, 'Updating AI credit usage limit')
        
        return platformPlanService(request.log).update({
            platformId,
            aiCreditsOverageLimit: limit,
        })
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

}

const InfoRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    response: {
        [StatusCodes.OK]: PlatformBillingInformation,
    },
}

const SetAiCreditsOverageLimitRequest = {
    schema: {
        body: SetAiCreditsOverageLimitParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const EnableAiCreditsOverageRequest = {
    schema: {
        body: ToggleAiCreditsOverageEnabledParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
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