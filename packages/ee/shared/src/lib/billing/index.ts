import { isNil, PiecesFilterType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
export * from './plan-limits'
import Stripe from 'stripe'

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
    TRIALING = 'trialing',
}

export const DEFAULT_BUSINESS_SEATS = 5

export const PRICE_PER_EXTRA_USER = 20

export enum PlanName {
    FREE = 'free',
    PLUS = 'plus',
    BUSINESS = 'business',
}

export enum PlanNameWithEnterprise {
    ENTERPRISE = 'enterprise',
}

export const CreateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
})
export type CreateSubscriptionParams = Static<typeof CreateSubscriptionParamsSchema>


export const EnableAiCreditUsageParamsSchema = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 10 })),
})
export type EnableAiCreditUsageParams = Static<typeof EnableAiCreditUsageParamsSchema>


export const UpdateSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.FREE), Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
    seats: Type.Optional(Type.Number()),
})
export type UpdateSubscriptionParams = Static<typeof UpdateSubscriptionParamsSchema>


export const getAiCreditsPriceId = (stripeKey: string | undefined) => {
    const testMode = stripeKey?.startsWith('sk_test')
    return testMode
        ? 'price_1RcktVQN93Aoq4f8JjdYKXBp'
        : 'price_1RflgeKZ0dZRqLEKGVORuNNl'
}

export function getUserPriceId(stripeKey: string | undefined) {
    const testMode = stripeKey?.startsWith('sk_test')
    return testMode
        ? 'price_1RU2GkQN93Aoq4f8ogetgfUB'
        : 'price_1RflgiKZ0dZRqLEKiDFoa17I'
}

export function getPlanPriceId(stripeKey: string | undefined) {
    const testMode = stripeKey?.startsWith('sk_test')
    return {
        [PlanName.PLUS]: testMode ? 'price_1RTRd4QN93Aoq4f8E22qF5JU' : 'price_1RflgUKZ0dZRqLEK5COq9Kn8',
        [PlanName.BUSINESS]: testMode ? 'price_1RTReBQN93Aoq4f8v9CnMTFT' : 'price_1RflgbKZ0dZRqLEKaW4Nlt0P',
    }

}

export function getPlanFromPriceId(priceId: string): PlanName {
    switch (priceId) {
        case 'price_1RTRd4QN93Aoq4f8E22qF5JU':
        case 'price_1RflgUKZ0dZRqLEK5COq9Kn8':
            return PlanName.PLUS
        case 'price_1RTReBQN93Aoq4f8v9CnMTFT':
        case 'price_1RflgbKZ0dZRqLEKaW4Nlt0P':
            return PlanName.BUSINESS
        default:
            throw new Error(`Unknown price ID: ${priceId}`)
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

    return getPlanFromPriceId(subscription.items.data[0].price.id)
}

const PLAN_HIERARCHY = {
    [PlanName.FREE]: 0,
    [PlanName.PLUS]: 1,
    [PlanName.BUSINESS]: 2,
} as const

export const isUpgradeExperience = (
    currentPlan: PlanName, 
    newPlan: PlanName,
    userSeatsLimit?: number,
    seats?: number,
): boolean => {

    if (currentPlan === PlanName.PLUS && newPlan === PlanName.PLUS) {
        return true
    }

    const isPlanTierUpgrade = PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan]
    const isSeatsUpgrade = !!(newPlan === PlanName.BUSINESS && 
                             userSeatsLimit && 
                             seats && 
                             userSeatsLimit < seats)
    
    return isPlanTierUpgrade || isSeatsUpgrade
}