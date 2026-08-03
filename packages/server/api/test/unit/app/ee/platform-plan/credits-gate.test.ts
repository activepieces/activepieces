import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreditsBalanceCache } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'

let storedCredits: CreditsBalanceCache | null = null
let autumnCredits: CreditsBalanceCache | null = null
let claims: Set<string> = new Set()
let lockChain: Promise<unknown> = Promise.resolve()

const mockBillingEnforced = vi.fn()
const mockResolveClientForPlatform = vi.fn()

vi.mock('../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils', () => ({
    autumnUtils: {
        readBalance: async ({ featureId }: { featureId: string }) =>
            featureId === 'apCredits' ? storedCredits : null,
        resolveClientForPlatform: (...args: unknown[]) => mockResolveClientForPlatform(...args),
        writeCustomerStateCaches: async () => {
            storedCredits = autumnCredits
            return { credits: autumnCredits, appSumo: null }
        },
    },
    autumnConsole: {},
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        get: (...args: unknown[]) => mockBillingEnforced(...args),
        async putIfAbsent(key: string): Promise<boolean> {
            if (claims.has(key)) {
                return false
            }
            claims.add(key)
            return true
        },
    },
    distributedLock: () => ({
        runExclusive: <T>({ fn }: { fn: () => Promise<T> }): Promise<T> => {
            const result = lockChain.then(() => fn())
            lockChain = result.catch(() => undefined)
            return result
        },
    }),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({}),
    assertSeatsNotBelowActiveUsers: vi.fn(),
}))

import { autumnBillingProvider, toGateState } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing'

function balance(overrides: Partial<CreditsBalanceCache>): CreditsBalanceCache {
    return { granted: 1000, usage: 0, remaining: 1000, unlimited: false, nextResetAt: null, syncedAt: 0, ...overrides }
}

function fresh(overrides: Partial<CreditsBalanceCache>): CreditsBalanceCache {
    return balance({ syncedAt: Date.now(), ...overrides })
}

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger

function gateState() {
    return autumnBillingProvider(log).getCreditsAndAppSumoState('platform-1')
}

describe('toGateState — credits (enforcement-gated)', () => {
    it('blocks only when billing is enforced AND credits are exhausted', () => {
        expect(toGateState({ balance: balance({ remaining: 0 }), enforced: true }).blocked).toBe(true)
    })

    it('does not block exhausted credits when billing is not enforced', () => {
        expect(toGateState({ balance: balance({ remaining: 0 }), enforced: false }).blocked).toBe(false)
    })

    it('does not block while credits remain', () => {
        expect(toGateState({ balance: balance({ remaining: 100 }), enforced: true }).blocked).toBe(false)
    })

    it('never blocks an unlimited balance', () => {
        expect(toGateState({ balance: balance({ remaining: 0, unlimited: true }), enforced: true }).blocked).toBe(false)
    })

    it('fails open when no balance is cached', () => {
        expect(toGateState({ balance: null, enforced: true }).blocked).toBe(false)
    })
})

describe('toGateState — AppSumo (always enforced)', () => {
    it('blocks on exhaustion regardless of billing enforcement (hard cap)', () => {
        expect(toGateState({ balance: balance({ remaining: 0 }), enforced: true }).blocked).toBe(true)
    })

    it('does not block while credits remain', () => {
        expect(toGateState({ balance: balance({ remaining: 100 }), enforced: true }).blocked).toBe(false)
    })

    it('never blocks an unlimited balance', () => {
        expect(toGateState({ balance: balance({ remaining: 0, unlimited: true }), enforced: true }).blocked).toBe(false)
    })

    it('fails open when no balance is cached', () => {
        expect(toGateState({ balance: null, enforced: true }).blocked).toBe(false)
    })
})

describe('credits gate re-verifies an exhausted cached balance before blocking', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        claims = new Set()
        lockChain = Promise.resolve()
        storedCredits = null
        autumnCredits = null
        mockBillingEnforced.mockResolvedValue(true)
        mockResolveClientForPlatform.mockResolvedValue({ getCustomer: vi.fn().mockResolvedValue({ balances: {}, flags: {} }) })
    })

    it('unblocks when Autumn has since granted an auto top-up the track response did not carry', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ granted: 15000, remaining: 5000 })

        const { credits } = await gateState()

        expect(credits.blocked).toBe(false)
        expect(credits.remaining).toBe(5000)
    })

    it('unblocks every request in a concurrent burst while querying Autumn only once', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ granted: 15000, remaining: 5000 })

        const results = await Promise.all([gateState(), gateState(), gateState()])

        expect(results.map((result) => result.credits.blocked)).toEqual([false, false, false])
        expect(mockResolveClientForPlatform).toHaveBeenCalledTimes(1)
    })

    it('stays blocked when Autumn confirms the balance is still exhausted', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ remaining: 0 })

        const { credits } = await gateState()

        expect(credits.blocked).toBe(true)
    })

    it('does not re-query Autumn for a burst once a re-verification confirmed zero', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ remaining: 0 })

        const results = await Promise.all([gateState(), gateState(), gateState()])

        expect(results.map((result) => result.credits.blocked)).toEqual([true, true, true])
        expect(mockResolveClientForPlatform).toHaveBeenCalledTimes(1)
    })

    it('does not re-query Autumn for sequential runs while a recent re-verification confirmed zero', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ remaining: 0 })

        const first = await gateState()
        const second = await gateState()
        const third = await gateState()

        expect([first, second, third].map((result) => result.credits.blocked)).toEqual([true, true, true])
        expect(mockResolveClientForPlatform).toHaveBeenCalledTimes(1)
    })

    it('does not call Autumn when the cached balance is not blocking', async () => {
        storedCredits = fresh({ remaining: 500 })

        const { credits } = await gateState()

        expect(credits.blocked).toBe(false)
        expect(mockResolveClientForPlatform).not.toHaveBeenCalled()
    })

    it('does not call Autumn when exhaustion does not block because billing is unenforced', async () => {
        mockBillingEnforced.mockResolvedValue(false)
        storedCredits = fresh({ remaining: 0 })

        const { credits } = await gateState()

        expect(credits.blocked).toBe(false)
        expect(mockResolveClientForPlatform).not.toHaveBeenCalled()
    })

    it('keeps blocking when the re-verification call fails', async () => {
        storedCredits = fresh({ remaining: 0 })
        mockResolveClientForPlatform.mockRejectedValue(new Error('autumn unreachable'))

        const { credits } = await gateState()

        expect(credits.blocked).toBe(true)
        expect(log.warn).toHaveBeenCalled()
    })
})
