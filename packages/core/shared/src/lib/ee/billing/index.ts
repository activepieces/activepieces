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

export const ConsumableProductTopupParams = z.object({
    credits: z.number(),
    featureId: z.enum(AutumnFeatureId).optional(),
})
export type ConsumableProductTopupParams = z.infer<typeof ConsumableProductTopupParams>

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
})
export type PurchasablePlan = z.infer<typeof PurchasablePlan>

export const ConsumableProductAutoTopupParams = z.union([
    z.object({
        state: z.literal(AiCreditsAutoTopUpState.ENABLED),
        minThreshold: z.number(),
        creditsToAdd: z.number(),
        maxMonthlyLimit: Nullable(z.number()),
        featureId: z.enum(AutumnFeatureId),
    }),
    z.object({
        state: z.literal(AiCreditsAutoTopUpState.DISABLED),
        featureId: z.enum(AutumnFeatureId),
    }),
])
export type ConsumableProductAutoTopupParams = z.infer<typeof ConsumableProductAutoTopupParams>

export const AUTUMN_FREE_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'free',
    tablesEnabled: true,
    eventStreamingEnabled: false,
    includedCredits: 100,
    activeFlowsLimit: undefined,
    projectsLimit: 1,
    embeddingEnabled: false,
    aiProvidersEnabled: false,
    chatEnabled: false,
    dataManipulationEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
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

export const OPEN_SOURCE_PLAN: PlatformPlanWithOnlyLimits = {
    tablesEnabled: true,
    embeddingEnabled: false,
    aiProvidersEnabled: true,
    chatEnabled: false,
    dataManipulationEnabled: false,
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
