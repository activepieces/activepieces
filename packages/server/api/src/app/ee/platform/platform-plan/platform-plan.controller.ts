import { ApSubscriptionStatus, CreateSubscriptionParamsSchema, DEFAULT_BUSINESS_SEATS, EnableAiCreditUsageParamsSchema, isUpgradeExperience, PlanName, UpdateSubscriptionParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
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
        

        const [platformBilling, usage] = await Promise.all([
            platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            platformUsageService(request.log).getAllPlatformUsage(platform.id),
        ])

        const { stripeSubscriptionCancelDate: cancelDate } = platformBilling
        const { endDate: nextBillingDate } = await platformPlanService(request.log).getBillingDates(platformBilling)

        const nextBillingAmount = await getNextBillingAmount(platformBilling.stripeSubscriptionStatus as ApSubscriptionStatus, request.log, platformBilling.stripeSubscriptionId)

        const response: PlatformBillingInformation = {
            plan: platformBilling,
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

    fastify.post('/set-ai-credit-usage-limit', EnableAiCreditUsageRequest, async (request) => {
        const platformId = request.principal.platform.id
        const { limit } = request.body
        
        const [usage, platformBilling] = await Promise.all([
            platformUsageService(request.log).getAllPlatformUsage(platformId),
            platformPlanService(request.log).getOrCreateForPlatform(platformId),
        ])
        assertNotNullOrUndefined(platformBilling, 'Plan is not set')
        
        const subscriptionId = platformBilling.stripeSubscriptionId
        assertNotNullOrUndefined(subscriptionId, 'Stripe subscription id is not set')
        
        if (platformBilling.plan === PlanName.FREE) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'AI credit usage limits are only available for paid plans',
                },
            })
        }

        const totalCreditsUsed = usage.aiCredits || 0
        const planIncludedCredits = platformBilling?.includedAiCredits || 0
        const overageCreditsUsed = Math.max(0, totalCreditsUsed - planIncludedCredits)

        if (!limit) {
            if (overageCreditsUsed > 0) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `Cannot disable usage-based billing while you have ${overageCreditsUsed} overage credits used.`,
                    },
                })
            }
            
            return platformPlanService(request.log).update({
                platformId,
                aiCreditsLimit: undefined,
            })
        }
        
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
            previousLimit: platformBilling.aiCreditsLimit,
            newLimit: limit,
            currentUsage: {
                total: totalCreditsUsed,
                planCredits: Math.min(totalCreditsUsed, planIncludedCredits),
                overageCredits: overageCreditsUsed,
            },
        }, 'Updating AI credit usage limit')
        
        return platformPlanService(request.log).update({
            platformId,
            aiCreditsLimit: limit,
        })
    })

    fastify.post('/create-subscription', CreateSubscriptionRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan } = request.body

        return stripeHelper(request.log).createSubscriptionCheckoutUrl(
            platformBilling.platformId,
            customerId,
            { plan },
        )

    })

    fastify.post('/update-subscription', UpgradeRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const subscriptionId = platformBilling.stripeSubscriptionId
        assertNotNullOrUndefined(subscriptionId, 'Stripe subscription id is not set')

        const { plan: newPlan, seats } = request.body
        const extraUsers =  seats ? seats - DEFAULT_BUSINESS_SEATS : 0

        const currentPlan = platformBilling.plan as PlanName ?? PlanName.FREE

        const upgradeExperience = isUpgradeExperience(currentPlan, newPlan, platformBilling.userSeatsLimit, seats)

        if (newPlan !== PlanName.BUSINESS && !isNil(seats)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Extra users are only available for business plan',
                },
            })
        }

        return stripeHelper(request.log).handleSubscriptionUpdate(
            platformBilling.platformId,
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


const EnableAiCreditUsageRequest = {
    schema: {
        body: EnableAiCreditUsageParamsSchema,
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