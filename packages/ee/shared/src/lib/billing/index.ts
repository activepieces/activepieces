import { PiecesFilterType, PlatformPlanLimits, PlatformUsage, PlatformUsageMetric } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
export * from './plan-limits'

export type FlowPlanLimits = {
    nickname: string
    tasks: number | null
    pieces: string[]
    aiCredits: number | null
    piecesFilterType: PiecesFilterType
}

export enum ApSubscriptionStatus {
    ACTIVE = 'active',
    CANCELED = 'canceled',
}

export const MAXIMUM_ALLOWED_TASKS = 1000_000

export const PRICE_PER_EXTRA_USER = 10

export enum PlanName {
    FREE = 'free',
    PLUS = 'plus',
    BUSINESS = 'business',
    ENTERPRISE = 'enterprise',
}

export const CreateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS), Type.Literal(PlanName.FREE)]),
})
export type CreateSubscriptionParams = Static<typeof CreateSubscriptionParamsSchema>



export const UpdateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS), Type.Literal(PlanName.FREE)]),
    extraUsers: Type.Optional(Type.Number()),
})
export type UpdateSubscriptionParams = Static<typeof UpdateSubscriptionParamsSchema>


export const getAiCreditsPriceId = (stripeKey: string | undefined) => {
    const testMode = stripeKey?.startsWith('sk_test')
    return testMode
        ? 'price_1RTRhOQN93Aoq4f8F6wt47v3'
        : 'price_live_ai_credits_monthly'
}

export function getTasksPriceId(stripeKey: string | undefined) {
    const testMode = stripeKey?.startsWith('sk_test')
    return testMode
        ? 'price_1OnWqKKZ0dZRqLEKkcYBso8K'
        : 'price_1Qf7RiKZ0dZRqLEKAgP38l7w'
}

export function getUserPriceId(stripeKey: string | undefined) {
    const testMode = stripeKey?.startsWith('sk_test')
    return testMode
        ? 'price_1RU2GkQN93Aoq4f8ogetgfUB'
        : 'price_live_user_monthly'
}

export function getPlanPriceId(stripeKey: string | undefined) {
    const testMode = stripeKey?.startsWith('sk_test')
    return {
            [PlanName.FREE]:  testMode ? 'price_1RU2A3QN93Aoq4f8IMLseT2z' : 'price_live_free_monthly',
            [PlanName.PLUS]: testMode ? 'price_1RTRd4QN93Aoq4f8E22qF5JU' : 'price_live_plus_monthly',
            [PlanName.BUSINESS]: testMode ? 'price_1RTReBQN93Aoq4f8v9CnMTFT' : 'price_live_business_monthly',
        }
}

export const isUpgradeExperience = (currentPlan: PlanName, newPlan: PlanName) => {
    if (currentPlan === newPlan) {
        return true;
    }

    return currentPlan === PlanName.FREE && newPlan === PlanName.PLUS || currentPlan === PlanName.PLUS && newPlan === PlanName.BUSINESS
}

export const checkCanDowngrade = (newPlanLimits: Partial<PlatformPlanLimits>, currentPlatformUsage: PlatformUsage): {canDowngrade: boolean, metrics: PlatformUsageMetric[]} => {
    const exceededMetrics: PlatformUsageMetric[] = []

    if (newPlanLimits.userSeatsLimit && currentPlatformUsage.seats > newPlanLimits.userSeatsLimit) {
        exceededMetrics.push(PlatformUsageMetric.USER_SEATS)
    }

    if (newPlanLimits.projectsLimit && currentPlatformUsage.projects > newPlanLimits.projectsLimit) {
        exceededMetrics.push(PlatformUsageMetric.PROJECTS)
    }

    if (newPlanLimits.activeFlowsLimit && currentPlatformUsage.activeFlows > newPlanLimits.activeFlowsLimit) {
        exceededMetrics.push(PlatformUsageMetric.ACTIVE_FLOWS)
    }

    if (newPlanLimits.tablesLimit && currentPlatformUsage.tables > newPlanLimits.tablesLimit) {
        exceededMetrics.push(PlatformUsageMetric.TABLES)
    }

    return {
        canDowngrade: exceededMetrics.length === 0,
        metrics: exceededMetrics,
    }
}