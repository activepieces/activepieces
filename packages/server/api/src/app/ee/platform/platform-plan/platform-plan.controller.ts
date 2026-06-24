import { isNil } from '@activepieces/core-utils'
import { AiCreditsAutoTopUpState, AutumnFeatureId, CheckoutPlanParamsSchema, CheckoutSessionResponse, ConsumableProductAutoTopupParams, ConsumableProductTopupParams, PlatformBillingInformation, PrincipalType, PurchasablePlan } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { billingProvider } from '../../../platform/billing-provider'
import { platformService } from '../../../platform/platform.service'
import { platformPlanService } from './platform-plan.service'

export const platformPlanController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.get('/info', InfoRequest, async (request) => {
        const platform = await platformService(request.log).getOneOrThrow(request.principal.platform.id)
        const [platformPlan, usage, { autoTopUps, topUpFeatures }] = await Promise.all([
            platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            platformPlanService(request.log).getUsage(platform.id),
            billingProvider.get(request.log).getTopUpSettings(platform.id),
        ])

        const { endDate: nextBillingDate, nextBillingAmount, cancelAt } = await billingProvider.get(request.log).getBillingInfo(platform.id)

        const response: PlatformBillingInformation = {
            plan: platformPlan,
            usage,
            nextBillingAmount,
            nextBillingDate,
            cancelAt,
            autoTopUps,
            topUpFeatures,
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
        const body = request.body
        const enabled = body.state === AiCreditsAutoTopUpState.ENABLED
        const { setupPaymentUrl } = await billingProvider.get(request.log).configureAutoTopUp({
            platformId: request.principal.platform.id,
            featureId: body.featureId,
            enabled,
            threshold: enabled ? body.minThreshold : 0,
            quantity: enabled ? body.creditsToAdd : 0,
            maxMonthlyTopUps: enabled && !isNil(body.maxMonthlyLimit) && body.creditsToAdd > 0 ? Math.floor(body.maxMonthlyLimit / body.creditsToAdd) : null,
        })
        return { paymentUrl: setupPaymentUrl }
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
