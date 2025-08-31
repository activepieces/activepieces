import { AiOverageState, PiecesFilterType, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsageMetric } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export enum BillingCycle {
    MONTHLY = 'monthly',
    ANNUAL = 'annual',
}

export const PRICE_PER_EXTRA_USER_MAP = {
    [BillingCycle.ANNUAL]: 11.4,
    [BillingCycle.MONTHLY]: 15,
}

export const PRICE_PER_EXTRA_PROJECT_MAP = {
    [BillingCycle.ANNUAL]: 7.6,
    [BillingCycle.MONTHLY]: 10,
}
export const PRICE_PER_EXTRA_5_ACTIVE_FLOWS_MAP = {
    [BillingCycle.ANNUAL]: 11.4,
    [BillingCycle.MONTHLY]: 15,
}

export const AI_CREDITS_USAGE_THRESHOLD = 15000

export type ProjectPlanLimits = {
    nickname?: string
    tasks?: number | null
    locked?: boolean
    pieces?: string[]
    aiCredits?: number | null
    piecesFilterType?: PiecesFilterType
}

export enum ApSubscriptionStatus {
    ACTIVE = 'active',
    CANCELED = 'canceled',
    TRIALING = 'trialing',
}

export enum PlanName {
    FREE = 'free',
    PLUS = 'plus',
    BUSINESS = 'business',
    ENTERPRISE = 'enterprise',
}

export type StripePlanName = PlanName.PLUS | PlanName.BUSINESS

export const METRIC_TO_LIMIT_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlowsLimit',
    [PlatformUsageMetric.USER_SEATS]: 'userSeatsLimit',
    [PlatformUsageMetric.PROJECTS]: 'projectsLimit',
    [PlatformUsageMetric.TABLES]: 'tablesLimit',
    [PlatformUsageMetric.MCPS]: 'mcpLimit',
    [PlatformUsageMetric.AGENTS]: 'agentsLimit',
} as const

export const METRIC_TO_USAGE_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlows',
    [PlatformUsageMetric.USER_SEATS]: 'seats',
    [PlatformUsageMetric.PROJECTS]: 'projects',
    [PlatformUsageMetric.TABLES]: 'tables',
    [PlatformUsageMetric.MCPS]: 'mcps',
    [PlatformUsageMetric.AGENTS]: 'agents',
} as const

export const RESOURCE_TO_MESSAGE_MAPPING = {
    [PlatformUsageMetric.PROJECTS]: 'Project limit reached. Delete old projects or upgrade to create new ones.',
    [PlatformUsageMetric.TABLES]: 'Table limit reached. Please delete tables or upgrade to restore access.',
    [PlatformUsageMetric.MCPS]: 'MCP server limit reached. Delete unused MCPs or upgrade your plan to continue.',
    [PlatformUsageMetric.AGENTS]: 'Agent limit reached. Remove agents or upgrade your plan to restore functionality.',
}

const Addons = Type.Object({
    userSeats: Type.Optional(Type.Number()),
    activeFlows: Type.Optional(Type.Number()),
    projects: Type.Optional(Type.Number()),
})

export const CreateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
    cycle: Type.Enum(BillingCycle),
    addons: Addons,
})
export type CreateSubscriptionParams = Static<typeof CreateSubscriptionParamsSchema>

export const SetAiCreditsOverageLimitParamsSchema = Type.Object({
    limit: Type.Number({ minimum: 10 }),
})
export type SetAiCreditsOverageLimitParams = Static<typeof SetAiCreditsOverageLimitParamsSchema>

export const ToggleAiCreditsOverageEnabledParamsSchema = Type.Object({
    state: Type.Enum(AiOverageState),
})
export type ToggleAiCreditsOverageEnabledParams = Static<typeof ToggleAiCreditsOverageEnabledParamsSchema>

export const StartTrialParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
})
export type StartTrialParams = Static<typeof StartTrialParamsSchema>

export const UpdateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.FREE), Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
    addons: Addons,
    cycle: Type.Enum(BillingCycle),
})
export type UpdateSubscriptionParams = Static<typeof UpdateSubscriptionParamsSchema>

export enum PRICE_NAMES {
    PLUS_PLAN = 'plus-plan',
    BUSINESS_PLAN = 'business-plan',
    AI_CREDITS = 'ai-credit',
    ACTIVE_FLOWS = 'active-flow',
    USER_SEAT = 'user-seat',
    PROJECT = 'project',
}

export const getPlanLimits = (planName: PlanName): Partial<PlatformPlanLimits> => {
    switch (planName) {
        case PlanName.FREE:
            return { ...FREE_CLOUD_PLAN }
        case PlanName.PLUS:
            return { ...PLUS_CLOUD_PLAN }
        case PlanName.BUSINESS:
            return { ...BUSINESS_CLOUD_PLAN }
        default:
            throw new Error(`Invalid plan name: ${planName}`)
    }
}

export const PLAN_HIERARCHY = {
    [PlanName.FREE]: 0,
    [PlanName.PLUS]: 1,
    [PlanName.BUSINESS]: 2,
    [PlanName.ENTERPRISE]: 3,
} as const

export const BILLING_CYCLE_HIERARCHY = {
    [BillingCycle.MONTHLY]: 0,
    [BillingCycle.ANNUAL]: 1,
} as const

export const PRICE_ID_MAP = {
    [PRICE_NAMES.PLUS_PLAN]: {
        [BillingCycle.MONTHLY]: {
            dev: 'price_1RTRd4QN93Aoq4f8E22qF5JU',
            prod: 'price_1RflgUKZ0dZRqLEK5COq9Kn8',
        },
        [BillingCycle.ANNUAL]: {
            dev: 'price_1RtZrSQN93Aoq4f8KLZq4yif',
            prod: 'price_1RtZwlKZ0dZRqLEKBiPradv4',
        },
    },
    [PRICE_NAMES.BUSINESS_PLAN]: {
        [BillingCycle.MONTHLY]: {
            dev: 'price_1RTReBQN93Aoq4f8v9CnMTFT',
            prod: 'price_1RflgbKZ0dZRqLEKaW4Nlt0P',
        },
        [BillingCycle.ANNUAL]: {
            dev: 'price_1RtZpuQN93Aoq4f8mNgEjs0b',
            prod: 'price_1RtZxNKZ0dZRqLEKqTYawR8q',
        },
    },
    [PRICE_NAMES.AI_CREDITS]: {
        [BillingCycle.MONTHLY]: {
            dev: 'price_1RnbNPQN93Aoq4f8GLiZbJFj',
            prod: 'price_1Rnj5bKZ0dZRqLEKQx2gwL7s',
        },
        [BillingCycle.ANNUAL]: {
            dev: 'price_1RtPc0QN93Aoq4f8JAPe5HbG',
            prod: 'price_1RtZziKZ0dZRqLEKiWU2iAz8',
        },
    },
    [PRICE_NAMES.ACTIVE_FLOWS]: {
        [BillingCycle.MONTHLY]: {
            dev: 'price_1RsK9qQN93Aoq4f8nhN9xvvu',
            prod: 'price_1RsK79KZ0dZRqLEKRGbtT1Pn',
        },
        [BillingCycle.ANNUAL]: {
            dev: 'price_1RtZmHQN93Aoq4f8OqAfOl8R',
            prod: 'price_1RtZvzKZ0dZRqLEKGHOXlfDP',
        },
    },
    [PRICE_NAMES.USER_SEAT]: {
        [BillingCycle.MONTHLY]: {
            dev: 'price_1Rtzi4QN93Aoq4f8l2jMsk9W',
            prod: 'price_1Rtzl2KZ0dZRqLEKdOr3G2YG',
        },
        [BillingCycle.ANNUAL]: {
            dev: 'price_1RtzkCQN93Aoq4f8thLTUyNi',
            prod: 'price_1RtzleKZ0dZRqLEKva8yji8k',
        },
    },
    [PRICE_NAMES.PROJECT]: {
        [BillingCycle.MONTHLY]: {
            dev: 'price_1RsoJ4QN93Aoq4f8JzLCO1BL',
            prod: 'price_1RsoHsKZ0dZRqLEKIQGB6RPe',
        },
        [BillingCycle.ANNUAL]: {
            dev: 'price_1RtPeZQN93Aoq4f8Mw8H9nGa',
            prod: 'price_1RtZv4KZ0dZRqLEKxR6uO7WQ',
        },
    },
}

export const FREE_CLOUD_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'free',
    tasksLimit: 1000,
    includedAiCredits: 200,
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.NOT_ALLOWED,
    activeFlowsLimit: 2,
    eligibleForTrial: PlanName.PLUS,
    userSeatsLimit: 1,
    projectsLimit: 1,
    tablesLimit: 1,
    mcpLimit: 1,
    agentsLimit: 0,

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

export const APPSUMO_PLAN = ({ planName: planname, tasksLimit, userSeatsLimit, agentsLimit, tablesLimit, mcpLimit }: { planName: string, tasksLimit: number, userSeatsLimit: number, agentsLimit: number, tablesLimit: number, mcpLimit: number }): PlatformPlanWithOnlyLimits => {
    return {
        plan: planname,
        tasksLimit,
        userSeatsLimit,
        includedAiCredits: 200,
        aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
        aiCreditsOverageLimit: undefined,
        activeFlowsLimit: undefined,
        projectsLimit: 1,
        mcpLimit,
        tablesLimit,
        agentsLimit,
        eligibleForTrial: undefined,

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
        projectRolesEnabled: true,
        customDomainsEnabled: false,
        apiKeysEnabled: false,
        ssoEnabled: false,

    }
}

export const PLUS_CLOUD_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'plus',
    tasksLimit: undefined,
    includedAiCredits: 500,
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
    eligibleForTrial: undefined,
    activeFlowsLimit: 10,
    userSeatsLimit: 1,
    projectsLimit: 1,
    mcpLimit: undefined,
    tablesLimit: undefined,
    agentsLimit: undefined,

    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,

    embeddingEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    ssoEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
}

export const BUSINESS_CLOUD_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'business',
    tasksLimit: undefined,
    includedAiCredits: 1000,
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
    eligibleForTrial: undefined,
    activeFlowsLimit: 50,
    userSeatsLimit: 5,
    projectsLimit: 10,
    mcpLimit: undefined,
    tablesLimit: undefined,
    agentsLimit: undefined,

    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,

    embeddingEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: true,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: true,
    projectRolesEnabled: true,
    customDomainsEnabled: false,
    apiKeysEnabled: true,
    ssoEnabled: true,
    showPoweredBy: false,
    auditLogEnabled: false,

}

export const OPEN_SOURCE_PLAN: PlatformPlanWithOnlyLimits = {
    eligibleForTrial: undefined,
    embeddingEnabled: false,

    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    tasksLimit: undefined,

    mcpsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    agentsEnabled: true,
    includedAiCredits: 0,
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
    environmentsEnabled: false,
    agentsLimit: undefined,
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
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
    stripeSubscriptionStatus: undefined,
}