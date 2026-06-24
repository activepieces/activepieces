import { isNil, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { AiCreditsAutoTopUpState, PlanName, PlatformPlanWithOnlyLimits, ToppableFeatureId } from '../../management/platform'
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
    featureId: ToppableFeatureId.optional(),
})
export type ConsumableProductTopupParams = z.infer<typeof ConsumableProductTopupParams>

export const CheckoutPlanParamsSchema = z.object({
    planId: z.string(),
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
        featureId: ToppableFeatureId,
    }),
    z.object({
        state: z.literal(AiCreditsAutoTopUpState.DISABLED),
        featureId: ToppableFeatureId,
    }),
])
export type ConsumableProductAutoTopupParams = z.infer<typeof ConsumableProductAutoTopupParams>

export const STANDARD_CLOUD_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'standard',
    tablesEnabled: true,
    eventStreamingEnabled: false,
    includedAiCredits: 200,
    activeFlowsLimit: 10,
    projectsLimit: 1,
    aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
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

export const AUTUMN_FREE_PLAN: PlatformPlanWithOnlyLimits = {
    ...STANDARD_CLOUD_PLAN,
    plan: 'free',
    includedAiCredits: 100,
    activeFlowsLimit: undefined,
    projectsLimit: 1,
}

export const OPEN_SOURCE_PLAN: PlatformPlanWithOnlyLimits = {
    tablesEnabled: true,
    embeddingEnabled: false,
    aiProvidersEnabled: true,
    chatEnabled: false,
    dataManipulationEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    includedAiCredits: 0,
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
    aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
    dedicatedWorkers: null,
    canary: false,
    customDomainsEnabled: false,
}

export const APPSUMO_PLAN = (planName: PlanName): PlatformPlanWithOnlyLimits => ({
    ...STANDARD_CLOUD_PLAN,
    plan: planName,
    eventStreamingEnabled: false,
    activeFlowsLimit: undefined,
})

export const isCloudPlanButNotEnterprise = (plan?: string | null): boolean => {
    if (isNil(plan)) {
        return false
    }

    return plan === PlanName.STANDARD
}
