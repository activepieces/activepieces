import { AiOverageState, isNil, PiecesFilterType, PlanName, PlatformPlanWithOnlyLimits, PlatformUsageMetric, TeamProjectsLimit } from '@activepieces/shared'
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


export const SetAiCreditsOverageLimitParamsSchema = Type.Object({
    limit: Type.Number({ minimum: 10 }),
})

export type SetAiCreditsOverageLimitParams = Static<typeof SetAiCreditsOverageLimitParamsSchema>

export const ToggleAiCreditsOverageEnabledParamsSchema = Type.Object({
    state: Type.Enum(AiOverageState),
})
export type ToggleAiCreditsOverageEnabledParams = Static<typeof ToggleAiCreditsOverageEnabledParamsSchema>

export const UpdateActiveFlowsAddonParamsSchema = Type.Object({
    newActiveFlowsLimit: Type.Number(),
})
export type UpdateActiveFlowsAddonParams = Static<typeof UpdateActiveFlowsAddonParamsSchema>

export const CreateCheckoutSessionParamsSchema = Type.Object({
    newActiveFlowsLimit: Type.Number(),
})
export type CreateSubscriptionParams = Static<typeof CreateCheckoutSessionParamsSchema>

export enum PRICE_NAMES {
    AI_CREDITS = 'ai-credit',
    ACTIVE_FLOWS = 'active-flow',
}

export const PRICE_ID_MAP = {
    [PRICE_NAMES.AI_CREDITS]: {
        dev: 'price_1RnbNPQN93Aoq4f8GLiZbJFj',
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
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
    activeFlowsLimit: 10,
    projectsLimit: 1,

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
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.NOT_ALLOWED,
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