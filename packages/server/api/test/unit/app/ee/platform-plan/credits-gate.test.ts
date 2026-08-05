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
        async runOnceWithin(key: string, _ttlInSeconds: number, fn: () => Promise<unknown>): Promise<void> {
            if (claims.has(key)) {
                return
            }
            claims.add(key)
            await fn()
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

import { autumnBillingProvider, computeCreditState } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing'

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

function settleBackgroundWork(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('computeCreditState — credits (enforcement-gated)', () => {
    it('blocks only when billing is enforced AND credits are exhausted', () => {
        expect(computeCreditState({ balance: balance({ remaining: 0 }), enforced: true }).blocked).toBe(true)
    })

    it('does not block exhausted credits when billing is not enforced', () => {
        expect(computeCreditState({ balance: balance({ remaining: 0 }), enforced: false }).blocked).toBe(false)
    })

    it('does not block while credits remain', () => {
        expect(computeCreditState({ balance: balance({ remaining: 100 }), enforced: true }).blocked).toBe(false)
    })

    it('never blocks an unlimited balance', () => {
        expect(computeCreditState({ balance: balance({ remaining: 0, unlimited: true }), enforced: true }).blocked).toBe(false)
    })

    it('fails open when no balance is cached', () => {
        expect(computeCreditState({ balance: null, enforced: true }).blocked).toBe(false)
    })
})

describe('computeCreditState — AppSumo (always enforced)', () => {
    it('blocks on exhaustion regardless of billing enforcement (hard cap)', () => {
        expect(computeCreditState({ balance: balance({ remaining: 0 }), enforced: true }).blocked).toBe(true)
    })

    it('does not block while credits remain', () => {
        expect(computeCreditState({ balance: balance({ remaining: 100 }), enforced: true }).blocked).toBe(false)
    })

    it('never blocks an unlimited balance', () => {
        expect(computeCreditState({ balance: balance({ remaining: 0, unlimited: true }), enforced: true }).blocked).toBe(false)
    })

    it('fails open when no balance is cached', () => {
        expect(computeCreditState({ balance: null, enforced: true }).blocked).toBe(false)
    })
})

describe('credits gate decides from the cache and refreshes in the background', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        claims = new Set()
        lockChain = Promise.resolve()
        storedCredits = null
        autumnCredits = null
        mockBillingEnforced.mockResolvedValue(true)
        mockResolveClientForPlatform.mockResolvedValue({ getCustomer: vi.fn().mockResolvedValue({ balances: {}, flags: {} }) })
    })

    it('blocks on the cached balance without waiting for Autumn, even when Autumn already granted a top-up', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ granted: 15000, remaining: 5000 })

        const { credits } = await gateState()

        expect(credits.blocked).toBe(true)
        expect(credits.remaining).toBe(0)
    })

    it('unblocks the next request once the background refresh has written the top-up', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ granted: 15000, remaining: 5000 })

        expect((await gateState()).credits.blocked).toBe(true)
        await settleBackgroundWork()

        const { credits } = await gateState()

        expect(credits.blocked).toBe(false)
        expect(credits.remaining).toBe(5000)
    })

    it('stays blocked when the refresh confirms the balance is still exhausted', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ remaining: 0 })

        expect((await gateState()).credits.blocked).toBe(true)
        await settleBackgroundWork()

        expect((await gateState()).credits.blocked).toBe(true)
    })

    it('queries Autumn once for a concurrent burst', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ remaining: 0 })

        const results = await Promise.all([gateState(), gateState(), gateState()])
        await settleBackgroundWork()

        expect(results.map((result) => result.credits.blocked)).toEqual([true, true, true])
        expect(mockResolveClientForPlatform).toHaveBeenCalledTimes(1)
    })

    it('queries Autumn once across sequential runs while the debounce holds', async () => {
        storedCredits = fresh({ remaining: 0 })
        autumnCredits = fresh({ remaining: 0 })

        await gateState()
        await settleBackgroundWork()
        await gateState()
        await gateState()
        await settleBackgroundWork()

        expect(mockResolveClientForPlatform).toHaveBeenCalledTimes(1)
    })

    it('refreshes a stale cache in the background even when it is not blocking', async () => {
        storedCredits = balance({ remaining: 500, syncedAt: 0 })
        autumnCredits = fresh({ remaining: 500 })

        expect((await gateState()).credits.blocked).toBe(false)
        await settleBackgroundWork()

        expect(mockResolveClientForPlatform).toHaveBeenCalledTimes(1)
    })

    it('does not call Autumn when the cached balance is fresh and not blocking', async () => {
        storedCredits = fresh({ remaining: 500 })

        const { credits } = await gateState()
        await settleBackgroundWork()

        expect(credits.blocked).toBe(false)
        expect(mockResolveClientForPlatform).not.toHaveBeenCalled()
    })

    it('does not call Autumn when exhaustion does not block because billing is unenforced', async () => {
        mockBillingEnforced.mockResolvedValue(false)
        storedCredits = fresh({ remaining: 0 })

        const { credits } = await gateState()
        await settleBackgroundWork()

        expect(credits.blocked).toBe(false)
        expect(mockResolveClientForPlatform).not.toHaveBeenCalled()
    })

    it('keeps blocking when the background refresh fails', async () => {
        storedCredits = fresh({ remaining: 0 })
        mockResolveClientForPlatform.mockRejectedValue(new Error('autumn unreachable'))

        expect((await gateState()).credits.blocked).toBe(true)
        await settleBackgroundWork()

        expect((await gateState()).credits.blocked).toBe(true)
        expect(log.error).toHaveBeenCalled()
    })

    it('fails open without scheduling a refresh when the cache read itself fails', async () => {
        storedCredits = fresh({ remaining: 0 })
        mockBillingEnforced.mockRejectedValue(new Error('redis unreachable'))

        const { credits } = await gateState()
        await settleBackgroundWork()

        expect(credits.blocked).toBe(false)
        expect(mockResolveClientForPlatform).not.toHaveBeenCalled()
        expect(log.warn).toHaveBeenCalled()
    })
})
