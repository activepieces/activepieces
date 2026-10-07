import { AiChargeBasis } from '@activepieces/core-utils'
import { AiUsageCharge } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

const rate = { value: 0.0005 }

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getDecimalOrThrow: () => rate.value },
}))

const { chargeFor, costBasisOf } = await import('../../../../src/app/ai/ai-credits')

describe('chargeFor', () => {
    it('converts an observed dollar cost at the configured rate', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.0005 } })).toBe(1)
        expect(chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.005 } })).toBe(10)
    })

    it('keeps a small call fractional rather than rounding it up to a whole credit', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.00037 } })).toBeCloseTo(0.74, 6)
    })

    it('charges nothing for a genuinely free model, which reports a real cost of zero', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0 } })).toBe(0)
    })

    it('scales with the size of the call, which is the whole point of billing on cost', () => {
        const small = chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.0004 } })
        const large = chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.004 } })
        expect(large).toBeCloseTo(small * 10, 6)
    })

    it('passes flat credits straight through, which is how a BYOK call bills one per model call', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.FIXED_CREDITS, credits: 1 } })).toBe(1)
    })

    it('passes a flat charge of several credits through unchanged', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.FIXED_CREDITS, credits: 4 } })).toBe(4)
    })

    it('adds one credit per tool call on top of what the model call cost', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.0005 }, toolCalls: 3 })).toBe(4)
    })

    it('charges the tool calls a BYOK turn made alongside its flat credit', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.FIXED_CREDITS, credits: 1 }, toolCalls: 2 })).toBe(3)
    })

    it('charges for tool calls even when the model call itself cost nothing', () => {
        expect(chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0 }, toolCalls: 2 })).toBe(2)
    })

    it('refuses a rate of zero rather than billing an unbounded number of credits', () => {
        rate.value = 0
        expect(() => chargeFor({ usage: { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.0042 } })).toThrow(/greater than zero/)
        rate.value = 0.0005
    })
})

describe('costBasisOf', () => {
    it('records the dollars the call cost and the rate they were converted at', () => {
        expect(costBasisOf({ type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.005 })).toEqual({ costUsd: 0.005, creditUsdValue: 0.0005 })
    })

    it('records the rate in force at the time, so a later rate change cannot rewrite what was charged', () => {
        rate.value = 0.001
        expect(costBasisOf({ type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.005 })).toEqual({ costUsd: 0.005, creditUsdValue: 0.001 })
        rate.value = 0.0005
    })

    it('reports a basis a reader can divide back into the credits that were billed', () => {
        const usage: AiUsageCharge = { type: AiChargeBasis.PROVIDER_REPORTED_COST, costUsd: 0.0037 }
        const basis = costBasisOf(usage)
        expect(basis!.costUsd / basis!.creditUsdValue).toBeCloseTo(chargeFor({ usage }), 6)
    })

    it('records nothing for a flat charge, which never went through a dollar rate', () => {
        expect(costBasisOf({ type: AiChargeBasis.FIXED_CREDITS, credits: 1 })).toBeUndefined()
    })
})
