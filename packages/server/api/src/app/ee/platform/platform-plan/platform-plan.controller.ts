import { ListAICreditsUsageRequest, ListAICreditsUsageResponse } from '@activepieces/common-ai'
import { BillingCycle, CreateSubscriptionParamsSchema, getPlanLimits, PlanName, SetAiCreditsOverageLimitParamsSchema, StartTrialParamsSchema, ToggleAiCreditsOverageEnabledParamsSchema, UpdateSubscriptionParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, AiOverageState, assertNotNullOrUndefined, ErrorCode, isNil, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { platformUsageService } from '../platform-usage-service'
import { PlatformPlanHelper } from './platform-plan-helper'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

export const platformPlanController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)

    fastify.get('/info', InfoRequest, async (request: FastifyRequest) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        const [platformPlan, usage] = await Promise.all([
            platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            platformUsageService(request.log).getAllPlatformUsage(platform.id),
        ])

        const { stripeSubscriptionCancelDate: cancelDate } = platformPlan
        const { endDate: nextBillingDate } = await platformPlanService(request.log).getBillingDates(platformPlan)

        const nextBillingAmount = await platformPlanService(request.log).getNextBillingAmount({ plan: platformPlan.plan!, subscriptionId: platformPlan.stripeSubscriptionId })

        const response: PlatformBillingInformation = {
            plan: platformPlan,
            usage,
            nextBillingAmount,
            nextBillingDate,
            cancelAt: cancelDate,
        }
        return response
    })

    fastify.post('/portal', {}, async (request) => {
        return stripeHelper(request.log).createPortalSessionUrl(request.principal.platform.id)
    })

    fastify.post('/update-ai-overage-state', EnableAiCreditsOverageRequest, async (request) => {
        const platformId = request.principal.platform.id
        const { state } = request.body
        
        const [usage, platformPlan] = await Promise.all([
            platformUsageService(request.log).getAllPlatformUsage(platformId),
            platformPlanService(request.log).getOrCreateForPlatform(platformId),
        ])
        
        if (platformPlan.plan === PlanName.FREE && state !== AiOverageState.NOT_ALLOWED) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'AI credit usage limits are only available for paid plans',
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
            platformUsageService(request.log).getAllPlatformUsage(platformId),
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

    fastify.post('/create-subscription', CreateSubscriptionRequest, async (request) => {
        const { stripeCustomerId: customerId, ...platformPlan } = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan, cycle, addons } = request.body

        const baseLimits = getPlanLimits(plan as PlanName)
        const baseUserSeatsLimit = baseLimits.userSeatsLimit ?? 0
        const baseProjectsLimit = baseLimits.projectsLimit ?? 0
        const baseActiveFlowsLimit = baseLimits.activeFlowsLimit ?? 0

        const newProjectsLimit = addons.projects ?? 0
        const newActiveFlowsLimit = addons.activeFlows ?? 0
        const newUserSeatsLimit = addons.userSeats ?? 0

        const extraUserSeats = Math.max(0, newUserSeatsLimit - baseUserSeatsLimit)
        const extraActiveFlows = Math.max(0, newActiveFlowsLimit - baseActiveFlowsLimit)
        const extraProjects = Math.max(0, newProjectsLimit - baseProjectsLimit)

        return stripeHelper(request.log).createSubscriptionCheckoutUrl(
            platformPlan.platformId,
            customerId,
            { plan, cycle, addons: {
                userSeats: extraUserSeats,
                projects: extraProjects,
                activeFlows: extraActiveFlows,
            } },
        )

    })

    fastify.post('/update-subscription', UpgradeRequest, async (request) => {
        const { plan: currentPlan, stripeSubscriptionId: subscriptionId, projectsLimit, activeFlowsLimit, userSeatsLimit, stripeBillingCycle } = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        assertNotNullOrUndefined(subscriptionId, 'Stripe subscription id is not set')

        const { plan: newPlan, addons, cycle } = request.body

        const baseLimits = getPlanLimits(currentPlan as PlanName)
        const baseUserSeatsLimit = baseLimits.userSeatsLimit ?? 0
        const baseProjectsLimit = baseLimits.projectsLimit ?? 0
        const baseActiveFlowsLimit = baseLimits.activeFlowsLimit ?? 0

        const currentProjectsLimit = projectsLimit ?? 0
        const currentActiveFlowsLimit = activeFlowsLimit ?? 0
        const currentUserSeatsLimit = userSeatsLimit ?? 0

        const newProjectsLimit = addons.projects ?? currentProjectsLimit
        const newActiveFlowsLimit = addons.activeFlows ?? currentActiveFlowsLimit
        const newUserSeatsLimit = addons.userSeats ?? currentUserSeatsLimit

        const extraUserSeats = Math.max(0, newUserSeatsLimit - baseUserSeatsLimit)
        const extraActiveFlows = Math.max(0, newActiveFlowsLimit - baseActiveFlowsLimit)
        const extraProjects = Math.max(0, newProjectsLimit - baseProjectsLimit)

        const isUpgrade = PlatformPlanHelper.isUpgradeExperience({
            currentActiveFlowsLimit,
            currentProjectsLimit,
            currentUserSeatsLimit,
            newPlan,
            currentPlan: currentPlan as PlanName,
            newActiveFlowsLimit,
            newProjectsLimit,
            newUserSeatsLimit,
            newCycle: cycle,
            currentCycle: stripeBillingCycle as BillingCycle,
        })

        await PlatformPlanHelper.checkLegitSubscriptionUpdateOrThrow({ projectsAddon: extraProjects, userSeatsAddon: extraUserSeats, newPlan })

        return stripeHelper(request.log).handleSubscriptionUpdate({
            extraActiveFlows,
            extraProjects,
            extraUserSeats,
            isUpgrade,
            newPlan,
            subscriptionId,
            newCycle: cycle,
            currentCycle: stripeBillingCycle as BillingCycle,
        })
    })

    fastify.post('/start-trial', StartTrialRequest, async (request) => {
        const { plan } = request.body
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        
        if (isNil(platformBilling.eligibleForTrial)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Platform is not eligible for trial',
                },
            })
        }

        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        await stripeHelper(request.log).startTrial({ customerId, platformId: platformBilling.platformId, plan, existingSubscriptionId: platformBilling.stripeSubscriptionId })

        return { success: true }
    })

    fastify.get('/ai-credits-usage', ListAIUsageRequest, async (request) => {
        const { limit, cursor } = request.query
        const platformId = request.principal.platform.id
        
        return platformUsageService(request.log).listAICreditsUsage({
            platformId,
            cursor: cursor ?? null,
            limit: limit ?? 10,
        })
    })
}

const InfoRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    response: {
        [StatusCodes.OK]: PlatformBillingInformation,
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

const CreateSubscriptionRequest = {
    schema: {
        body: CreateSubscriptionParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const SetAiCreditsOverageLimitRequest = {
    schema: {
        body: SetAiCreditsOverageLimitParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const EnableAiCreditsOverageRequest = {
    schema: {
        body: ToggleAiCreditsOverageEnabledParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const StartTrialRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: StartTrialParamsSchema,
    },
    response: {
        [StatusCodes.OK]: Type.Object({
            success: Type.Boolean(),
        }),
    },
}

const ListAIUsageRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        querystring: ListAICreditsUsageRequest,
        response: {
            [StatusCodes.OK]: ListAICreditsUsageResponse,
        },
    },
} 