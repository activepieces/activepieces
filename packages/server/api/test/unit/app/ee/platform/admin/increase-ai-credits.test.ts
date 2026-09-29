import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOpenRouterKeyLimitLockKey } from '../../../../../../src/app/database/redis/keys'

const { keyLimits, runExclusive, provisionKey, getKey, updateKey } = vi.hoisted(() => {
    const keyLimits = new Map<string, number>()
    const lockChains = new Map<string, Promise<unknown>>()
    const roundTrip = () => new Promise((resolve) => setTimeout(resolve, 20))
    return {
        keyLimits,
        runExclusive: vi.fn(<T>({ key, fn }: { key: string, fn: () => Promise<T> }): Promise<T> => {
            const result = (lockChains.get(key) ?? Promise.resolve()).then(() => fn())
            lockChains.set(key, result.catch(() => undefined))
            return result
        }),
        provisionKey: vi.fn(async (platformId: string) => ({ apiKey: 'key', apiKeyHash: `hash-${platformId}` })),
        getKey: vi.fn(async ({ hash }: { hash: string }) => {
            const limit = keyLimits.get(hash)
            await roundTrip()
            return { data: { hash, limit } }
        }),
        updateKey: vi.fn(async ({ hash, limit }: { hash: string, limit: number }) => {
            await roundTrip()
            keyLimits.set(hash, limit)
            return { data: { hash, limit } }
        }),
    }
})

vi.mock('../../../../../../src/app/database/redis-connections', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    distributedLock: () => ({ runExclusive }),
}))

vi.mock('../../../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({
        getOrCreateActivePiecesProviderAuthConfig: provisionKey,
    }),
}))

vi.mock('../../../../../../src/app/ee/platform/platform-plan/openrouter/openrouter-api', () => ({
    openRouterApi: { getKey, updateKey },
}))

import { adminPlatformService } from '../../../../../../src/app/ee/platform/admin/admin-platform.service'
import { system } from '../../../../../../src/app/helper/system/system'

const log = system.globalLogger()

describe('adminPlatformService.increaseAiCredits', () => {
    beforeEach(() => {
        keyLimits.clear()
        vi.clearAllMocks()
    })

    it('applies every grant when two grants for the same platform run concurrently', async () => {
        keyLimits.set('hash-platform-1', 100)

        await Promise.all([
            adminPlatformService(log).increaseAiCredits({ platformId: 'platform-1', amountInUsd: 10 }),
            adminPlatformService(log).increaseAiCredits({ platformId: 'platform-1', amountInUsd: 10 }),
        ])

        expect(keyLimits.get('hash-platform-1')).toBe(120)
        expect(runExclusive).toHaveBeenCalledWith(expect.objectContaining({ key: getOpenRouterKeyLimitLockKey('platform-1') }))
        expect(Math.max(...provisionKey.mock.invocationCallOrder)).toBeGreaterThan(Math.min(...updateKey.mock.invocationCallOrder))
    })

    it('surfaces a failed grant and still applies the next grant for the same platform', async () => {
        keyLimits.set('hash-platform-4', 30)
        getKey.mockRejectedValueOnce(new Error('[OpenRouter] GET /keys/hash-platform-4 error: 503'))

        const [failed, applied] = await Promise.allSettled([
            adminPlatformService(log).increaseAiCredits({ platformId: 'platform-4', amountInUsd: 5 }),
            adminPlatformService(log).increaseAiCredits({ platformId: 'platform-4', amountInUsd: 8 }),
        ])

        expect(failed.status).toBe('rejected')
        expect(applied.status).toBe('fulfilled')
        expect(keyLimits.get('hash-platform-4')).toBe(38)
    })

    it('does not make grants for different platforms wait on each other', async () => {
        keyLimits.set('hash-platform-2', 50)
        keyLimits.set('hash-platform-3', 20)

        await Promise.all([
            adminPlatformService(log).increaseAiCredits({ platformId: 'platform-2', amountInUsd: 7 }),
            adminPlatformService(log).increaseAiCredits({ platformId: 'platform-3', amountInUsd: 3 }),
        ])

        expect(keyLimits.get('hash-platform-2')).toBe(57)
        expect(keyLimits.get('hash-platform-3')).toBe(23)
        const lastRead = Math.max(...getKey.mock.invocationCallOrder)
        const firstWrite = Math.min(...updateKey.mock.invocationCallOrder)
        expect(lastRead).toBeLessThan(firstWrite)
    })
})
