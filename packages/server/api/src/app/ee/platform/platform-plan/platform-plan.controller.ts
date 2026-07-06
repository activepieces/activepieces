import { SeekPage } from '@activepieces/core-utils'
import { AutumnFeatureId, CheckoutPlanParamsSchema, CheckoutSessionResponse, ConsumableProductAutoTopupParams, ConsumableProductTopupParams, isNil, PlatformBillingInformation, PrincipalType, ProjectCreditUsage, PurchasablePlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { getEntitlementsForceRefreshKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { billingProvider } from '../../../platform/billing-provider'
import { platformService } from '../../../platform/platform.service'
import { platformPlanService } from './platform-plan.service'

const FORCE_REFRESH_DEDUP_SECONDS = 60
const DEFAULT_USAGE_PAGE_SIZE = 10

export const platformPlanController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.get('/info', InfoRequest, async (request) => {
        return getBillingInformation(request.log, request.principal.platform.id)
    })

    fastify.post('/refresh', RefreshRequest, async (request) => {
        const platformId = request.principal.platform.id
        await distributedStore.runOnceWithin(
            getEntitlementsForceRefreshKey(platformId),
            FORCE_REFRESH_DEDUP_SECONDS,
            () => billingProvider.get(request.log).refreshEntitlements(platformId),
        )
        return getBillingInformation(request.log, platformId)
    })

    fastify.get('/plans', ListPlansRequest, async (request) => {
        return billingProvider.get(request.log).listPlans(request.principal.platform.id)
    })

    fastify.get('/projects-usage', ProjectsUsageRequest, async (request) => {
        return platformPlanService(request.log).getCreditUsageByProject({
            platformId: request.principal.platform.id,
            startDate: request.query.startDate,
            endDate: request.query.endDate,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_USAGE_PAGE_SIZE,
            userId: request.principal.id,
            principalType: request.principal.type,
        })
    })

    fastify.post('/checkout', CheckoutRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        const result = await provider.createCheckoutSession({
            platformId,
            planId: request.body.planId,
            successUrl: request.body.successUrl,
        })
        if (isNil(result.checkoutUrl)) {
            await provider.refreshEntitlements(platformId)
        }
        return result
    })

    fastify.post('/cancel', CancelRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        await provider.cancelSubscription({ platformId })
        await provider.refreshEntitlements(platformId)
    })

    fastify.post('/reactivate', ReactivateRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        await provider.reactivateSubscription({ platformId })
        await provider.refreshEntitlements(platformId)
    })

    fastify.post('/portal', {
        config: {
            security: securityAccess.platformAdminOnly([PrincipalType.USER]),
        },
    }, async (request) => {
        const { url } = await billingProvider.get(request.log).getBillingPortalUrl({ platformId: request.principal.platform.id })
        return url
    })

    fastify.post('/activate', ActivateLicenseRequest, async (request) => {
        await billingProvider.get(request.log).activateLicense({
            platformId: request.principal.platform.id,
            licenseKey: request.body.licenseKey,
        })
    })

    fastify.post('/consumable-product-topups/checkout', ConsumableProductTopupRequest, async (request) => {
        const { credits, featureId } = request.body
        const { checkoutUrl } = await billingProvider.get(request.log).topUpFeature({
            platformId: request.principal.platform.id,
            featureId: featureId ?? AutumnFeatureId.AP_CREDITS,
            quantity: credits,
        })
        return { paymentUrl: checkoutUrl }
    })
    fastify.post('/consumable-product-topups/auto-topup', ConsumableProductAutoTopupRequest, async (request) => {
        const { setupPaymentUrl } = await billingProvider.get(request.log).configureAutoTopUp({
            ...request.body,
            platformId: request.principal.platform.id,
        })
        return { paymentUrl: setupPaymentUrl }
    })
}

async function getBillingInformation(log: FastifyBaseLogger, platformId: string): Promise<PlatformBillingInformation> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    const [platformPlan, usage, overview] = await Promise.all([
        platformPlanService(log).getOrCreateForPlatform(platform.id),
        platformPlanService(log).getUsage(platform.id),
        billingProvider.get(log).getBillingOverview(platform.id),
    ])

    const { startDate: billingPeriodStart, endDate: nextBillingDate, nextBillingAmount, cancelAt, trialEndsAt, planId: currentPlanId, planName: currentPlanName, scheduledPlanName, billingPortalAvailable, autoTopUps, topUpFeatures } = overview

    const usageWithCredits = usage.creditsRemaining === null
        ? { ...usage, creditsUsed: (await billingProvider.get(log).getCreditUsage({ platformId: platform.id, startDate: billingPeriodStart, endDate: nextBillingDate })).total }
        : usage

    return {
        plan: platformPlan,
        usage: usageWithCredits,
        currentPlanId,
        currentPlanName,
        scheduledPlanName,
        nextBillingAmount,
        nextBillingDate,
        cancelAt,
        trialEndsAt,
        autoTopUps,
        topUpFeatures,
        billingPortalAvailable,
    }
}

const InfoRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    response: {
        [StatusCodes.OK]: PlatformBillingInformation,
    },
}

const RefreshRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    response: {
        [StatusCodes.OK]: PlatformBillingInformation,
    },
}

const ProjectsUsageRequest = {
    schema: {
        querystring: z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            cursor: z.string().optional(),
            limit: z.coerce.number().optional(),
        }),
        response: {
            [StatusCodes.OK]: SeekPage(ProjectCreditUsage),
        },
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

const CancelRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const ReactivateRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const ConsumableProductTopupRequest = {
    schema: {
        body: ConsumableProductTopupParams,
        response: {
            [StatusCodes.OK]: z.object({
                paymentUrl: z.string().nullable(),
            }),
        },
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const ActivateLicenseRequest = {
    schema: {
        body: z.object({
            licenseKey: z.string(),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const ConsumableProductAutoTopupRequest = {
    schema: {
        body: ConsumableProductAutoTopupParams,
        response: {
            [StatusCodes.OK]: z.object({
                paymentUrl: z.string().optional(),
            }),
        },
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
