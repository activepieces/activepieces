import { describe, expect, it } from 'vitest'
import { AiCreditsAutoTopUpState, ConsumableFeatureId, ConsumableProductAutoTopupParams } from '../../src/index'

function enabled(overrides: Record<string, unknown>) {
    return ConsumableProductAutoTopupParams.safeParse({
        state: AiCreditsAutoTopUpState.ENABLED,
        featureId: ConsumableFeatureId.AP_CREDITS,
        minThreshold: 1000,
        creditsToAdd: 1000,
        maxMonthlyTopUps: 4,
        ...overrides,
    })
}

describe('ConsumableProductAutoTopupParams — creditsToAdd is the purchase quantity', () => {
    it('accepts a positive whole number of credits', () => {
        expect(enabled({}).success).toBe(true)
    })

    it.each([0, -1000, 1000.5])('rejects %s credits, which would reach Autumn as the purchase quantity', (creditsToAdd) => {
        expect(enabled({ creditsToAdd }).success).toBe(false)
    })

    it('allows a zero threshold so a top-up can fire only once the balance is empty', () => {
        expect(enabled({ minThreshold: 0 }).success).toBe(true)
    })

    it('rejects a negative threshold', () => {
        expect(enabled({ minThreshold: -1 }).success).toBe(false)
    })

    it('needs no amounts at all when auto top-up is disabled', () => {
        const result = ConsumableProductAutoTopupParams.safeParse({
            state: AiCreditsAutoTopUpState.DISABLED,
            featureId: ConsumableFeatureId.AP_CREDITS,
        })
        expect(result.success).toBe(true)
    })
})
