import { PiecesFilterType } from '@activepieces/shared'
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

export const PRICE_PER_USER = 10

export enum PlanName {
    FREE = 'free',
    PLUS = 'plus',
    BUSINESS = 'business',
    ENTERPRISE = 'enterprise',
}

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