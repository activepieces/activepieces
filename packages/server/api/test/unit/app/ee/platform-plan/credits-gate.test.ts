import { describe, expect, it } from 'vitest'
import { toAppSumoGateState, toCreditsGateState } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing'
import { CreditsBalanceCache } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'

function balance(overrides: Partial<CreditsBalanceCache>): CreditsBalanceCache {
    return { granted: 1000, usage: 0, remaining: 1000, unlimited: false, nextResetAt: null, syncedAt: 0, ...overrides }
}

describe('toCreditsGateState', () => {
    it('blocks only when billing is enforced AND credits are exhausted', () => {
        expect(toCreditsGateState(balance({ remaining: 0 }), true).blocked).toBe(true)
    })

    it('does not block exhausted credits when billing is not enforced', () => {
        expect(toCreditsGateState(balance({ remaining: 0 }), false).blocked).toBe(false)
    })

    it('does not block while credits remain', () => {
        expect(toCreditsGateState(balance({ remaining: 100 }), true).blocked).toBe(false)
    })

    it('never blocks an unlimited balance', () => {
        expect(toCreditsGateState(balance({ remaining: 0, unlimited: true }), true).blocked).toBe(false)
    })

    it('fails open when no balance is cached', () => {
        expect(toCreditsGateState(null, true).blocked).toBe(false)
    })
})

describe('toAppSumoGateState', () => {
    it('blocks on exhaustion regardless of billing enforcement (hard cap)', () => {
        expect(toAppSumoGateState(balance({ remaining: 0 })).blocked).toBe(true)
    })

    it('does not block while credits remain', () => {
        expect(toAppSumoGateState(balance({ remaining: 100 })).blocked).toBe(false)
    })

    it('never blocks an unlimited balance', () => {
        expect(toAppSumoGateState(balance({ remaining: 0, unlimited: true })).blocked).toBe(false)
    })

    it('fails open when no balance is cached', () => {
        expect(toAppSumoGateState(null).blocked).toBe(false)
    })
})
