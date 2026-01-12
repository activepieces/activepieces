import { AiCreditsAutoTopUpState, isNil, Nullable, PiecesFilterType, PlanName, PlatformPlanWithOnlyLimits, PlatformUsageMetric, TeamProjectsLimit } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const PRICE_PER_EXTRA_ACTIVE_FLOWS = 5
export const AI_CREDITS_USAGE_THRESHOLD = 15000

export type ProjectPlanLimits = {
    nickname?: string
    locked?: boolean
    pieces?: string[]
    aiCredits?: number | null
    piecesFilterType?: PiecesFilterType
}

export enum ApSubscriptionStatus {
    ACTIVE = 'active',
    CANCELED = 'canceled',
}

export const METRIC_TO_LIMIT_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlowsLimit',
} as const

export const METRIC_TO_USAGE_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlows',
} as const

export const UpdateActiveFlowsAddonParamsSchema = Type.Object({
    newActiveFlowsLimit: Type.Number(),
})
export type UpdateActiveFlowsAddonParams = Static<typeof UpdateActiveFlowsAddonParamsSchema>

export const CreateCheckoutSessionParamsSchema = Type.Object({
    newActiveFlowsLimit: Type.Number(),
})
export type CreateSubscriptionParams = Static<typeof CreateCheckoutSessionParamsSchema>

export const CreateAICreditCheckoutSessionParamsSchema = Type.Object({
    aiCredits: Type.Number(),
})
export type CreateAICreditCheckoutSessionParamsSchema = Static<typeof CreateAICreditCheckoutSessionParamsSchema>

export const UpdateAICreditsAutoTopUpParamsSchema = Type.Union([
    Type.Object({
        state: Type.Literal(AiCreditsAutoTopUpState.ENABLED),
        minThreshold: Type.Number(),
        creditsToAdd: Type.Number(),
        maxMonthlyLimit: Nullable(Type.Number()),
    }),
    Type.Object({
        state: Type.Literal(AiCreditsAutoTopUpState.DISABLED),
    }),
])
export type UpdateAICreditsAutoTopUpParamsSchema = Static<typeof UpdateAICreditsAutoTopUpParamsSchema>

export enum PRICE_NAMES {
    AI_CREDITS = 'ai-credit',
    ACTIVE_FLOWS = 'active-flow',
}

export const PRICE_ID_MAP = {
    [PRICE_NAMES.AI_CREDITS]: {
        dev: 'price_1SfgNxKTWXpWeD7hmDBG4YMZ',
        prod: 'price_1Rnj5bKZ0dZRqLEKQx2gwL7s',
    },
    [PRICE_NAMES.ACTIVE_FLOWS]: {
        dev: 'price_1SQbbYQN93Aoq4f8WK2JC4sf',
        prod: 'price_1SQbcvKZ0dZRqLEKHV5UepRx',
    },
}

export const STANDARD_CLOUD_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'standard',
    includedAiCredits: 200,
    activeFlowsLimit: 10,
    projectsLimit: 1,
    aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,
    embeddingEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: true,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    teamProjectsLimit: TeamProjectsLimit.ONE,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    ssoEnabled: false,
}

export const OPEN_SOURCE_PLAN: PlatformPlanWithOnlyLimits = {
    embeddingEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    mcpsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    agentsEnabled: true,
    includedAiCredits: 0,
    environmentsEnabled: false,
    analyticsEnabled: true,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    teamProjectsLimit: TeamProjectsLimit.NONE,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    ssoEnabled: false,
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
    stripeSubscriptionStatus: undefined,
    aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
}

export const APPSUMO_PLAN = (planName: PlanName): PlatformPlanWithOnlyLimits => ({
    ...STANDARD_CLOUD_PLAN,
    plan: planName,
    activeFlowsLimit: undefined,
})

export const isCloudPlanButNotEnterprise = (plan?: string): boolean => {
    if (isNil(plan)) {
        return false
    }

    return plan === PlanName.STANDARD
}