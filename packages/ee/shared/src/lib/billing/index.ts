import { AiOverageState, isNil, PiecesFilterType, PlanName, PlatformPlanWithOnlyLimits, PlatformUsageMetric } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const PRICE_PER_EXTRA_5_ACTIVE_FLOWS = 15

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
    [PlatformUsageMetric.PROJECTS]: 'projectsLimit',
} as const

export const METRIC_TO_USAGE_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlows',
    [PlatformUsageMetric.PROJECTS]: 'projects',
} as const

export const RESOURCE_TO_MESSAGE_MAPPING = {
    [PlatformUsageMetric.PROJECTS]: 'Project limit reached. Delete old projects or upgrade to create new ones.',
}

export const SetAiCreditsOverageLimitParamsSchema = Type.Object({
    limit: Type.Number({ minimum: 10 }),
})

export type SetAiCreditsOverageLimitParams = Static<typeof SetAiCreditsOverageLimitParamsSchema>

export const ToggleAiCreditsOverageEnabledParamsSchema = Type.Object({
    state: Type.Enum(AiOverageState),
})

export type ToggleAiCreditsOverageEnabledParams = Static<typeof ToggleAiCreditsOverageEnabledParamsSchema>

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
        dev: 'price_1RsK9qQN93Aoq4f8nhN9xvvu',
        prod: 'price_1RsK79KZ0dZRqLEKRGbtT1Pn',
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
    analyticsEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    ssoEnabled: false,
}

export const APPSUMO_PLAN:  PlatformPlanWithOnlyLimits = {
    ...STANDARD_CLOUD_PLAN,
    plan: PlanName.APPSUMO_ACTIVEPIECES,
    activeFlowsLimit: undefined
}

export const isCloudPlanButNotEnterprise = (plan: string | undefined): boolean => {
    if (isNil(plan)) {
        return false
    }
    // Louai: to be determined later
    return true
}