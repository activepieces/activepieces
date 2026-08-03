import { SeekPage, tryCatch } from '@activepieces/core-utils'
import { AdjustUnconsumableFeatureQuantityParams, CancelSubscriptionRequest, CheckoutPlanParamsSchema, CheckoutSessionResponse, ConsumableProductAutoTopupParams, isNil, PlatformBillingInformation, PrincipalType, ProjectCreditUsage, PurchasablePlan, SetupPaymentParams } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { getEntitlementsForceRefreshKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { billingProvider } from '../../../platform/billing-provider'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { platformPlanService } from './platform-plan.service'

const FORCE_REFRESH_DEDUP_SECONDS = 60
const DEFAULT_USAGE_PAGE_SIZE = 10

export const platformPlanController: FastifyPluginAsyncZod = async (app) => {

    app.get('/info', InfoRequest, async (request) => {
        return getBillingInformation(request.log, request.principal.platform.id)
    })

    app.post('/refresh', RefreshRequest, async (request) => {
        const platformId = request.principal.platform.id
        await distributedStore.runOnceWithin(
            getEntitlementsForceRefreshKey(platformId),
            FORCE_REFRESH_DEDUP_SECONDS,
            () => billingProvider.get(request.log).refreshEntitlements(platformId),
        )
        return getBillingInformation(request.log, platformId)
    })

    app.get('/plans', ListPlansRequest, async (request) => {
        return billingProvider.get(request.log).listPlans(request.principal.platform.id)
    })

    app.get('/projects-usage', ProjectsUsageRequest, async (request) => {
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

    app.post('/checkout', CheckoutRequest, async (request) => {
        const platformId = request.principal.platform.id
        const result = await billingProvider.get(request.log).createCheckoutSession({
            platformId,
            planId: request.body.planId,
            successUrl: request.body.successUrl,
        })
        await refreshWhenAppliedImmediately({ log: request.log, platformId, checkoutUrl: result.checkoutUrl })
        return result
    })

    app.post('/cancel', CancelRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        await provider.cancelSubscription({
            platformId,
            feedback: {
                reasons: request.body.reasons,
                comment: request.body.comment ?? null,
                canceledByEmail: await resolveActorEmail(request.log, request.principal.id),
            },
        })
        await provider.refreshEntitlements(platformId)
    })

    app.post('/reactivate', ReactivateRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        await provider.reactivateSubscription({ platformId })
        await provider.refreshEntitlements(platformId)
    })

    app.post('/portal', { config: PLATFORM_ADMIN_ONLY }, async (request) => {
        const { url } = await billingProvider.get(request.log).getBillingPortalUrl({ platformId: request.principal.platform.id })
        return url
    })

    app.post('/activate', ActivateLicenseRequest, async (request) => {
        await billingProvider.get(request.log).activateLicense({
            platformId: request.principal.platform.id,
            licenseKey: request.body.licenseKey,
        })
    })

    app.post('/unconsumable-feature-quantity', AdjustUnconsumableFeatureQuantityRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        const { checkoutUrl } = await provider.adjustUnconsumableFeatureQuantity({
            platformId,
            featureId: request.body.featureId,
            quantity: request.body.quantity,
        })
        await refreshWhenAppliedImmediately({ log: request.log, platformId, checkoutUrl })
        return { paymentUrl: checkoutUrl }
    })

    app.post('/consumable-product-topups/auto-topup', ConsumableProductAutoTopupRequest, async (request) => {
        const platformId = request.principal.platform.id
        const provider = billingProvider.get(request.log)
        await provider.configureAutoTopUp({
            ...request.body,
            platformId,
        })
        await provider.refreshEntitlements(platformId)
        return {}
    })

    app.post('/setup-payment', SetupPaymentRequest, async (request) => {
        return billingProvider.get(request.log).setupPayment({
            redirectUrl: request.body.redirectUrl,
            platformId: request.principal.platform.id,
        })
    })
}

async function getBillingInformation(log: FastifyBaseLogger, platformId: string): Promise<PlatformBillingInformation> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    const [platformPlan, usage, overview, billingEnforced] = await Promise.all([
        platformPlanService(log).getOrCreateForPlatform(platform.id),
        platformPlanService(log).getUsage(platform.id),
        billingProvider.get(log).getBillingOverview(platform.id),
        billingProvider.get(log).isBillingEnforced(platform.id),
    ])

    const { startDate: billingPeriodStart, endDate: nextBillingDate, nextBillingAmount, cancelAt, trialEndsAt, planName: autumnPlanName, scheduledPlanName, billingPortalAvailable, creditsResetInterval, creditsFeature, appSumoCreditsFeature, seatsFeature, includedSeats, additionalSeats, unavailable: billingUnavailable } = overview

    const usageWithCredits = usage.creditsRemaining === null
        ? { ...usage, creditsUsed: await fetchUnlimitedCreditsUsed({ log, platformId: platform.id, startDate: billingPeriodStart, endDate: nextBillingDate, fallback: usage.creditsUsed }) }
        : usage

    return {
        plan: platformPlan,
        usage: usageWithCredits,
        creditsResetInterval,
        autumnPlanName,
        scheduledPlanName,
        nextBillingAmount,
        nextBillingDate,
        cancelAt,
        trialEndsAt,
        creditsFeature,
        appSumoCreditsFeature,
        seatsFeature,
        billingPortalAvailable,
        billingEnforced,
        billingUnavailable,
        includedSeats,
        additionalSeats,
    }
}

async function refreshWhenAppliedImmediately({ log, platformId, checkoutUrl }: RefreshWhenAppliedImmediatelyParams): Promise<void> {
    if (!isNil(checkoutUrl)) {
        return
    }
    await billingProvider.get(log).refreshEntitlements(platformId)
}

async function resolveActorEmail(log: FastifyBaseLogger, userId: string): Promise<string | null> {
    const { data: user, error } = await tryCatch(() => userService(log).getMetaInformation({ id: userId }))
    if (!isNil(error) || isNil(user)) {
        log.warn({ error, user: { id: userId } }, 'Failed to resolve the cancelling user email; recording the cancellation without it')
        return null
    }
    return user.email
}

async function fetchUnlimitedCreditsUsed({ log, platformId, startDate, endDate, fallback }: { log: FastifyBaseLogger, platformId: string, startDate: string, endDate: string, fallback: number }): Promise<number> {
    const { data: creditUsage, error } = await tryCatch(() => billingProvider.get(log).getCreditUsage({ platformId, startDate, endDate }))
    if (!isNil(error) || isNil(creditUsage)) {
        log.warn({ error, platform: { id: platformId } }, 'Failed to aggregate credit usage for an unlimited plan; reporting the cached value')
        return fallback
    }
    return creditUsage.total
}

const PLATFORM_ADMIN_ONLY = {
    security: securityAccess.platformAdminOnly([PrincipalType.USER]),
}

const InfoRequest = {
    config: PLATFORM_ADMIN_ONLY,
    schema: {
        response: {
            [StatusCodes.OK]: PlatformBillingInformation,
        },
    },
}

const RefreshRequest = {
    config: PLATFORM_ADMIN_ONLY,
    schema: {
        response: {
            [StatusCodes.OK]: PlatformBillingInformation,
        },
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
    config: PLATFORM_ADMIN_ONLY,
}

const ListPlansRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: z.array(PurchasablePlan),
        },
    },
    config: PLATFORM_ADMIN_ONLY,
}

const CheckoutRequest = {
    schema: {
        body: CheckoutPlanParamsSchema,
        response: {
            [StatusCodes.OK]: CheckoutSessionResponse,
        },
    },
    config: PLATFORM_ADMIN_ONLY,
}

const CancelRequest = {
    config: PLATFORM_ADMIN_ONLY,
    schema: {
        body: CancelSubscriptionRequest,
    },
}

const ReactivateRequest = {
    config: PLATFORM_ADMIN_ONLY,
}


const AdjustUnconsumableFeatureQuantityRequest = {
    schema: {
        body: AdjustUnconsumableFeatureQuantityParams,
        response: {
            [StatusCodes.OK]: z.object({
                paymentUrl: z.string().nullable(),
            }),
        },
    },
    config: PLATFORM_ADMIN_ONLY,
}

const ActivateLicenseRequest = {
    schema: {
        body: z.object({
            licenseKey: z.string(),
        }),
    },
    config: PLATFORM_ADMIN_ONLY,
}

const ConsumableProductAutoTopupRequest = {
    schema: {
        body: ConsumableProductAutoTopupParams,
        response: {
            [StatusCodes.OK]: z.object({}),
        },
    },
    config: PLATFORM_ADMIN_ONLY,
}

const SetupPaymentRequest = {
    schema: {
        body: SetupPaymentParams,
        response: {
            [StatusCodes.OK]: z.object({
                url: z.string().nullable(),
            }),
        },
    },
    config: PLATFORM_ADMIN_ONLY,
}

type RefreshWhenAppliedImmediatelyParams = {
    log: FastifyBaseLogger
    platformId: string
    checkoutUrl: string | null
}
