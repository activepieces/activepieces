import { ApSubscriptionStatus, CreateSubscriptionParamsSchema, DEFAULT_BUSINESS_SEATS, isUpgradeExperience, PlanName, SetAiCreditsOverageLimitParamsSchema, ToggleAiCreditsOverageEnabledParamsSchema, UpdateSubscriptionParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, AiOverageState, assertNotNullOrUndefined, ErrorCode, isNil, ListAICreditsUsageRequest, ListAICreditsUsageResponse, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper } from './stripe-helper'

async function getNextBillingAmount(subscriptionStatus: ApSubscriptionStatus, log: FastifyBaseLogger, subscriptionId?: string): Promise<number> {
    const stripe = stripeHelper(log).getStripe()
    
    if (isNil(stripe)) {
        return 0
    }

    try {
        const upcomingInvoice = await stripe.invoices.createPreview({
            subscription: subscriptionId,
        })
        return upcomingInvoice.amount_due ? upcomingInvoice.amount_due / 100 : 0
    }
    catch {
        switch (subscriptionStatus) {
            case ApSubscriptionStatus.TRIALING: {
                return 25
            }
            default: {
                return 0
            }
        }
    }
}

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

        const nextBillingAmount = await getNextBillingAmount(platformPlan.stripeSubscriptionStatus as ApSubscriptionStatus, request.log, platformPlan.stripeSubscriptionId)

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
        const platformPlan = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformPlan.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan } = request.body

        return stripeHelper(request.log).createSubscriptionCheckoutUrl(
            platformPlan.platformId,
            customerId,
            { plan },
        )

    })

    fastify.post('/update-subscription', UpgradeRequest, async (request) => {
        const platformPlan = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const subscriptionId = platformPlan.stripeSubscriptionId
        assertNotNullOrUndefined(subscriptionId, 'Stripe subscription id is not set')

        const { plan: newPlan, seats } = request.body
        const extraUsers =  seats ? seats - DEFAULT_BUSINESS_SEATS : 0

        const currentPlan = platformPlan.plan as PlanName ?? PlanName.FREE

        const upgradeExperience = isUpgradeExperience(currentPlan, newPlan, platformPlan.userSeatsLimit, seats)

        if (newPlan !== PlanName.BUSINESS && !isNil(seats)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Extra users are only available for business plan',
                },
            })
        }

        return stripeHelper(request.log).handleSubscriptionUpdate(
            platformPlan.platformId,
            subscriptionId,
            newPlan,
            extraUsers,
            request.log,
            upgradeExperience,
        )
    })

    fastify.post('/start-trial', StartTrialRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        
        if (!platformBilling.eligibleForTrial) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Platform is not eligible for trial',
                },
            })
        }

        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const trialSubscriptionId = await stripeHelper(request.log).startTrial(customerId, platformBilling.platformId)
        
        if (trialSubscriptionId) {
            await platformPlanService(request.log).update({
                platformId: platformBilling.platformId,
                stripeSubscriptionId: trialSubscriptionId,
                eligibleForTrial: false,
            })
        }

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
