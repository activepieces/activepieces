import { AiOverageState, isNil, PiecesFilterType, PlatformPlanLimits, PlatformUsageMetric } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
export * from './plan-limits'
import Stripe from 'stripe'
import { BUSINESS_CLOUD_PLAN, FREE_CLOUD_PLAN, PLUS_CLOUD_PLAN } from './plan-limits'

export const PRICE_PER_EXTRA_USER = 20
export const PRICE_PER_EXTRA_PROJECT = 10
export const PRICE_PER_EXTRA_5_ACTIVE_FLOWS = 15
export const AI_CREDITS_USAGE_THRESHOLD = 150000

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

export const CreateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
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

const Addons = Type.Object({
    userSeats: Type.Optional(Type.Number()),
    activeFlows: Type.Optional(Type.Number()),
    projects: Type.Optional(Type.Number()),
})

export const UpdateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.FREE), Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
    addons: Addons,
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

export const getPriceIdFor = (price: string, stripeKey?: string): string => {
    const devEnv = stripeKey?.startsWith('sk_test')
    switch (price) {
        case PRICE_NAMES.PLUS_PLAN:
            return devEnv ? 'price_1RTRd4QN93Aoq4f8E22qF5JU' : 'price_1RflgUKZ0dZRqLEK5COq9Kn8'
        case PRICE_NAMES.BUSINESS_PLAN:
            return devEnv ? 'price_1RTReBQN93Aoq4f8v9CnMTFT' : 'price_1RflgbKZ0dZRqLEKaW4Nlt0P'
        case PRICE_NAMES.AI_CREDITS:
            return devEnv ? 'price_1RnbNPQN93Aoq4f8GLiZbJFj' : 'price_1Rnj5bKZ0dZRqLEKQx2gwL7s'
        case PRICE_NAMES.ACTIVE_FLOWS:
            return devEnv ? 'price_1RsK9qQN93Aoq4f8nhN9xvvu' : 'price_1RsK79KZ0dZRqLEKRGbtT1Pn'
        case PRICE_NAMES.USER_SEAT:
            return devEnv ? 'price_1Rsn8nQN93Aoq4f8nNmwAA1I' : 'price_1RflgiKZ0dZRqLEKiDFoa17I'
        case PRICE_NAMES.PROJECT:
            return devEnv ? 'price_1RsoJ4QN93Aoq4f8JzLCO1BL' : 'price_1RsoHsKZ0dZRqLEKIQGB6RPe'
        default:
            throw new Error('No price with the given price name is available')
    }
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

export function checkIsTrialSubscription(subscription: Stripe.Subscription): boolean {
    return isNil(subscription.metadata['trialSubscription']) ? false : subscription.metadata['trialSubscription'] === 'true'
}

export function getPlanFromSubscription(subscription: Stripe.Subscription): PlanName {
    if (subscription.status === ApSubscriptionStatus.TRIALING) {
        return PlanName.PLUS
    }

    if (subscription.status !== ApSubscriptionStatus.ACTIVE) {
        return PlanName.FREE
    }

    const priceId = subscription.items.data[0].price.id
    switch (priceId) {
        case 'price_1RTRd4QN93Aoq4f8E22qF5JU':
        case 'price_1RflgUKZ0dZRqLEK5COq9Kn8':
            return PlanName.PLUS
        case 'price_1RTReBQN93Aoq4f8v9CnMTFT':
        case 'price_1RflgbKZ0dZRqLEKaW4Nlt0P':
            return PlanName.BUSINESS
        default:
            return PlanName.FREE
    }
}

const PLAN_HIERARCHY = {
    [PlanName.FREE]: 0,
    [PlanName.PLUS]: 1,
    [PlanName.BUSINESS]: 2,
    [PlanName.ENTERPRISE]: 3,
} as const

export const isUpgradeExperience = (params: IsUpgradeEperienceParams): boolean => {
    const {
        currentActiveFlowsLimit,
        currentPlan,
        currentProjectsLimit,
        currentUserSeatsLimit,
        newActiveFlowsLimit,
        newPlan,
        newProjectsLimit,
        newUserSeatsLimit,
    } = params

    const currentTier = PLAN_HIERARCHY[currentPlan]
    const newTier = PLAN_HIERARCHY[newPlan]

    if (newTier > currentTier) {
        return true
    }

    if (newTier < currentTier) {
        return false
    }

    const isAddonUpgrade =
        (!isNil(newActiveFlowsLimit) && newActiveFlowsLimit > currentActiveFlowsLimit) ||
        (!isNil(newProjectsLimit) && newProjectsLimit > currentProjectsLimit) ||
        (!isNil(newUserSeatsLimit) && newUserSeatsLimit > currentUserSeatsLimit)

    return isAddonUpgrade
}

type IsUpgradeEperienceParams = {
    currentPlan: PlanName 
    newPlan: PlanName
    newUserSeatsLimit?: number
    newProjectsLimit?: number
    newActiveFlowsLimit?: number
    currentUserSeatsLimit: number
    currentProjectsLimit: number
    currentActiveFlowsLimit: number
}