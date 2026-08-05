import { isNil, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { AiCreditsAutoTopUpState, ConsumableFeatureId, PlanName, PlatformPlanWithOnlyLimits, UnconsumableFeatureId } from '../../management/platform'
import { PiecesFilterType } from '../../management/project'

export type ProjectPlanLimits = {
    nickname?: string
    locked?: boolean
    pieces?: string[]
    aiCredits?: number | null
    piecesFilterType?: PiecesFilterType
    activeFlowsLimit?: number | null
}


export const AdjustUnconsumableFeatureQuantityParams = z.object({
    featureId: z.enum(UnconsumableFeatureId),
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
        minThreshold: z.number().int().nonnegative(),
        creditsToAdd: z.number().int().positive(),
        maxMonthlyTopUps: Nullable(z.number().int().positive()),
        featureId: z.enum(ConsumableFeatureId),
    }),
    z.object({
        state: z.literal(AiCreditsAutoTopUpState.DISABLED),
        featureId: z.enum(ConsumableFeatureId),
    }),
])
export type ConsumableProductAutoTopupParams = z.infer<typeof ConsumableProductAutoTopupParams>

export const SetupPaymentParams = z.object({
    redirectUrl: z.string().optional(),
})
export type SetupPaymentParams = z.infer<typeof SetupPaymentParams>

export enum CancellationReason {
    SWITCHING_TO_ANOTHER_TOOL = 'switching_to_another_tool',
    MISSING_INTEGRATIONS = 'missing_integrations',
    NO_NEED_RIGHT_NOW = 'no_need_right_now',
    FREE_PLAN_IS_ENOUGH = 'free_plan_is_enough',
    BUGS_OR_TECHNICAL_ISSUES = 'bugs_or_technical_issues',
    TOO_EXPENSIVE = 'too_expensive',
}

export const CANCELLATION_COMMENT_MAX_LENGTH = 2000

export const CancelSubscriptionRequest = z.object({
    reasons: z.array(z.enum(CancellationReason)).default([]),
    comment: z.string().max(CANCELLATION_COMMENT_MAX_LENGTH).optional(),
})
export type CancelSubscriptionRequest = z.infer<typeof CancelSubscriptionRequest>

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
    billedTeamProjectsLimit: 0,
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
    billedTeamProjectsLimit: 1,
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

    return plan === PlanName.FREE || plan === PlanName.APPSUMO || plan === PlanName.FREE_LEGACY
}

export const PLATFORM_PURGE_DELAY_DAYS = 7

export const hasActiveSubscription = (plan?: string | null): boolean => {
    return !isNil(plan) && !isCloudPlanButNotEnterprise(plan)
}

export const isAppSumoCreditedPlan = (plan?: string | null): boolean => {
    if (isNil(plan)) {
        return false
    }

    return plan.toLowerCase().includes(PlanName.APPSUMO) || plan === PlanName.FREE_LEGACY
}

export const LEGACY_STANDARD_PLAN = 'standard'

export const LEGACY_FREE_PLANS: readonly string[] = [PlanName.FREE, LEGACY_STANDARD_PLAN]

export const FREE_LEGACY_CUTOFF_ISO = '2026-07-30T00:00:00.000Z'

export const isFreeLegacyEligible = ({ plan, created }: { plan?: string | null, created?: string | null }): boolean => {
    if (isNil(plan) || isNil(created) || !LEGACY_FREE_PLANS.includes(plan)) {
        return false
    }
    const createdAt = Date.parse(created)
    return !Number.isNaN(createdAt) && createdAt < Date.parse(FREE_LEGACY_CUTOFF_ISO)
}
