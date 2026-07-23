import { isNil, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { AiCreditsAutoTopUpState, AutumnFeatureId, PlanName, PlatformPlanWithOnlyLimits } from '../../management/platform'
import { PiecesFilterType } from '../../management/project'

export type ProjectPlanLimits = {
    nickname?: string
    locked?: boolean
    pieces?: string[]
    aiCredits?: number | null
    piecesFilterType?: PiecesFilterType
}


export const AdjustUnconsumableFeatureQuantityParams = z.object({
    featureId: z.enum(AutumnFeatureId),
    quantity: z.number().int().nonnegative(),
})
export type AdjustUnconsumableFeatureQuantityParams = z.infer<typeof AdjustUnconsumableFeatureQuantityParams>

export const CheckoutPlanParamsSchema = z.object({
    planId: z.string(),
    successUrl: z.string().optional(),
})
export type CheckoutPlanParams = z.infer<typeof CheckoutPlanParamsSchema>

export const CheckoutSessionResponse = z.object({
    checkoutUrl: Nullable(z.string()),
})
export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponse>

export const PurchasablePlan = z.object({
    id: z.string(),
    name: z.string(),
    description: Nullable(z.string()),
    price: Nullable(z.number()),
    interval: Nullable(z.string()),
    priceDisplay: Nullable(z.string()),
    baseVariantId: Nullable(z.string()),
    includedSeats: Nullable(z.number()),
    includedCredits: Nullable(z.number()),
    creditsResetInterval: Nullable(z.string()),
})
export type PurchasablePlan = z.infer<typeof PurchasablePlan>

export const ConsumableProductAutoTopupParams = z.discriminatedUnion('state', [
    z.object({
        state: z.literal(AiCreditsAutoTopUpState.ENABLED),
        minThreshold: z.number(),
        creditsToAdd: z.number(),
        maxMonthlyTopUps: Nullable(z.number().int().positive()),
        featureId: z.enum(AutumnFeatureId),
    }),
    z.object({
        state: z.literal(AiCreditsAutoTopUpState.DISABLED),
        featureId: z.enum(AutumnFeatureId),
    }),
])
export type ConsumableProductAutoTopupParams = z.infer<typeof ConsumableProductAutoTopupParams>

export const SetupPaymentParams = z.object({
    redirectUrl: z.string().optional(),
})
export type SetupPaymentParams = z.infer<typeof SetupPaymentParams>

export const AUTUMN_FREE_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'free',
    tablesEnabled: true,
    eventStreamingEnabled: false,
    includedCredits: 100,
    activeFlowsLimit: undefined,
    projectsLimit: 1,
    embeddingEnabled: false,
    aiProvidersEnabled: false,
    chatEnabled: true,
    workerGroupsEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: true,
    showPoweredBy: true,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    teamProjectsLimit: 0,
    projectRolesEnabled: false,
    apiKeysEnabled: true,
    ssoEnabled: false,
    secretManagersEnabled: false,
    scimEnabled: false,
    dedicatedWorkers: null,
    canary: false,
    customDomainsEnabled: false,
}

export const OPEN_SOURCE_PLAN: PlatformPlanWithOnlyLimits = {
    tablesEnabled: true,
    embeddingEnabled: false,
    aiProvidersEnabled: true,
    chatEnabled: false,
    workerGroupsEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    includedCredits: 0,
    environmentsEnabled: false,
    eventStreamingEnabled: false,
    analyticsEnabled: true,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    teamProjectsLimit: 1,
    projectRolesEnabled: false,
    apiKeysEnabled: false,
    ssoEnabled: false,
    secretManagersEnabled: false,
    scimEnabled: false,
    dedicatedWorkers: null,
    canary: false,
    customDomainsEnabled: false,
}

export const isCloudPlanButNotEnterprise = (plan?: string | null): boolean => {
    if (isNil(plan)) {
        return false
    }

    return plan === PlanName.FREE || plan === PlanName.APPSUMO
}
