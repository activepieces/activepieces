import { AiOverageState, PiecesFilterType, PlatformPlanLimits, PlatformUsageMetric } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
export * from './plan-limits'
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

export enum BillingCycle {
    MONTHLY = 'monthly',
    ANNUAL = 'annual',
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
    cycle: Type.Enum(BillingCycle)
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
    cycle: Type.Enum(BillingCycle)
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

export const PRICE_ID_MAP = {
  [PRICE_NAMES.PLUS_PLAN]: {
    [BillingCycle.MONTHLY]: {
      dev: 'price_1RTRd4QN93Aoq4f8E22qF5JU',
      prod: 'price_1RflgUKZ0dZRqLEK5COq9Kn8'
    },
    [BillingCycle.ANNUAL]: {
      dev: 'price_1RtPYWQN93Aoq4f8kq6Fts1A',
      prod: ''
    }
  },
  [PRICE_NAMES.BUSINESS_PLAN]: {
    [BillingCycle.MONTHLY]: {
      dev: 'price_1RTReBQN93Aoq4f8v9CnMTFT',
      prod: 'price_1RflgbKZ0dZRqLEKaW4Nlt0P'
    },
    [BillingCycle.ANNUAL]: {
      dev: 'price_1RtPZZQN93Aoq4f819GrY1ea',
      prod: ''
    }
  },
  [PRICE_NAMES.AI_CREDITS]: {
    [BillingCycle.MONTHLY]: {
      dev: 'price_1RnbNPQN93Aoq4f8GLiZbJFj',
      prod: 'price_1Rnj5bKZ0dZRqLEKQx2gwL7s'
    },
    [BillingCycle.ANNUAL]: {
      dev: 'price_1RtPc0QN93Aoq4f8JAPe5HbG',
      prod: ''
    }
  },
  [PRICE_NAMES.ACTIVE_FLOWS]: {
    [BillingCycle.MONTHLY]: {
      dev: 'price_1RsK9qQN93Aoq4f8nhN9xvvu',
      prod: 'price_1RsK79KZ0dZRqLEKRGbtT1Pn'
    },
    [BillingCycle.ANNUAL]: {
      dev: 'price_1RtPg8QN93Aoq4f8CG6CZR6I',
      prod: ''
    }
  },
  [PRICE_NAMES.USER_SEAT]: {
    [BillingCycle.MONTHLY]: {
      dev: 'price_1Rsn8nQN93Aoq4f8nNmwAA1I',
      prod: 'price_1RflgiKZ0dZRqLEKiDFoa17I'
    },
    [BillingCycle.ANNUAL]: {
      dev: 'price_1RtPiuQN93Aoq4f8O7ReOsZO',
      prod: ''
    }
  },
  [PRICE_NAMES.PROJECT]: {
    [BillingCycle.MONTHLY]: {
      dev: 'price_1RsoJ4QN93Aoq4f8JzLCO1BL',
      prod: 'price_1RsoHsKZ0dZRqLEKIQGB6RPe'
    },
    [BillingCycle.ANNUAL]: {
      dev: 'price_1RtPeZQN93Aoq4f8Mw8H9nGa',
      prod: ''
    }
  }
}