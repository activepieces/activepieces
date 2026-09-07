import { apId } from '@activepieces/core-utils'
import { ApEnvironment, PackageType, PieceType } from '@activepieces/shared'
import { fastify } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PieceMetadataSchema } from '../../../../src/app/pieces/metadata/piece-metadata-entity'

const mocks = vi.hoisted(() => {
    const properties = new Map<string, string>()
    const listeners: ((message: string) => void)[] = []
    return {
        properties,
        listeners,
        publish: vi.fn(),
        subscribe: vi.fn(async (_channel: string, listener: (message: string) => void) => {
            listeners.push(listener)
        }),
    }
})

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => vi.fn()),
}))

vi.mock('../../../../src/app/helper/pubsub', () => ({
    pubsub: {
        publish: mocks.publish,
        subscribe: mocks.subscribe,
    },
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        get: vi.fn((prop: string) => mocks.properties.get(prop)),
    },
}))

vi.mock('../../../../src/app/pieces/metadata/utils', () => ({
    loadDevPiecesIfEnabled: vi.fn().mockResolvedValue([]),
}))

type Deferred = {
    promise: Promise<void>
    resolve: () => void
}

function deferred(): Deferred {
    let resolve = (): void => {}
    const promise = new Promise<void>((done) => {
        resolve = done
    })
    return { promise, resolve }
}

function piece({ name, description = 'description' }: { name: string, description?: string }): PieceMetadataSchema {
    return {
        id: apId(),
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-01T00:00:00.000Z',
        name,
        displayName: name,
        logoUrl: 'https://example.com/logo.svg',
        description,
        authors: [],
        version: '1.0.0',
        actions: {},
        triggers: {},
        contextInfo: undefined,
        projectUsage: 0,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
    }
}

async function loadCache() {
    vi.resetModules()
    const { pieceCache } = await import('../../../../src/app/pieces/metadata/piece-cache')
    return pieceCache(fastify().log)
}

beforeEach(() => {
    vi.clearAllMocks()
    mocks.listeners.length = 0
    mocks.properties.clear()
    mocks.properties.set('ENVIRONMENT', ApEnvironment.PRODUCTION)
})

afterEach(() => {
    vi.useRealTimers()
})

describe('pieceCache list cache', () => {
    it('caches tenant and locale lists independently and returns copied graphs', async () => {
        const cache = await loadCache()
        const french = vi.fn().mockResolvedValue([piece({ name: 'fr' })])
        const english = vi.fn().mockResolvedValue([piece({ name: 'en' })])
        const key = JSON.stringify(['0.90.2', 'platform-a', 'fr'])
        const first = await cache.loadList({ key, loader: french })
        first[0].authors.push('changed')
        const second = await cache.loadList({ key, loader: french })
        await cache.loadList({ key: JSON.stringify(['0.90.2', 'platform-a', 'en']), loader: english })
        await cache.loadList({ key: JSON.stringify(['0.90.2', 'platform-b', 'fr']), loader: french })
        expect(second[0].displayName).toBe('fr')
        expect(second[0].authors).toEqual([])
        expect(french).toHaveBeenCalledTimes(2)
        expect(english).toHaveBeenCalledTimes(1)
    })

    it('shares four concurrent fills for one key', async () => {
        const cache = await loadCache()
        const gate = deferred()
        const loader = vi.fn(async () => {
            await gate.promise
            return [piece({ name: 'shared' })]
        })
        const requests = [
            cache.loadList({ key: 'shared', loader }),
            cache.loadList({ key: 'shared', loader }),
            cache.loadList({ key: 'shared', loader }),
            cache.loadList({ key: 'shared', loader }),
        ]
        await Promise.resolve()
        expect(loader).toHaveBeenCalledTimes(1)
        gate.resolve()
        const results = await Promise.all(requests)
        expect(results).toHaveLength(4)
        results[0][0].authors.push('changed')
        expect(results[1][0].authors).toEqual([])
        expect(results[0][0]).not.toBe(results[1][0])
    })

    it('does not serve a fill that was invalidated before it completed', async () => {
        const cache = await loadCache()
        const gate = deferred()
        const loader = vi.fn()
            .mockImplementationOnce(async () => {
                await gate.promise
                return [piece({ name: 'stale' })]
            })
            .mockResolvedValueOnce([piece({ name: 'fresh' })])
        const started = cache.loadList({ key: 'freshness', loader })
        const generation = cache.getGeneration()
        await cache.invalidate()
        gate.resolve()

        await expect(started).resolves.toMatchObject([{ name: 'fresh' }])
        expect(cache.getGeneration()).toBe(generation + 1)
        expect(loader).toHaveBeenCalledTimes(2)
    })

    it('invalidates locally and through pubsub', async () => {
        const cache = await loadCache()
        const loader = vi.fn()
            .mockResolvedValueOnce([piece({ name: 'first' })])
            .mockResolvedValueOnce([piece({ name: 'second' })])
            .mockResolvedValueOnce([piece({ name: 'third' })])

        await cache.setup()
        await cache.loadList({ key: 'invalidate', loader })
        await cache.invalidate()
        await cache.loadList({ key: 'invalidate', loader })
        const listener = mocks.listeners.at(0)
        listener?.('1')
        await cache.loadList({ key: 'invalidate', loader })

        expect(mocks.publish).toHaveBeenCalledTimes(1)
        expect(loader).toHaveBeenCalledTimes(3)
    })

    it('expires entries after sixty seconds', async () => {
        vi.useFakeTimers()
        const cache = await loadCache()
        const loader = vi.fn()
            .mockResolvedValueOnce([piece({ name: 'first' })])
            .mockResolvedValueOnce([piece({ name: 'second' })])

        await cache.loadList({ key: 'ttl', loader })
        await vi.advanceTimersByTimeAsync(60_001)
        await cache.loadList({ key: 'ttl', loader })
        expect(loader).toHaveBeenCalledTimes(2)
    })

    it('evicts the oldest entry after four cached lists', async () => {
        const cache = await loadCache()
        const loaders = Array.from({ length: 5 }, (_, index) => vi.fn().mockResolvedValue([piece({ name: `piece-${index}` })]))

        for (const [index, loader] of loaders.slice(0, 4).entries()) {
            await cache.loadList({ key: `entry-${index}`, loader })
        }
        await cache.loadList({ key: 'entry-0', loader: loaders[0] })
        await cache.loadList({ key: 'entry-4', loader: loaders[4] })
        await cache.loadList({ key: 'entry-0', loader: loaders[0] })
        await cache.loadList({ key: 'entry-1', loader: loaders[1] })

        expect(loaders[0]).toHaveBeenCalledTimes(1)
        expect(loaders[1]).toHaveBeenCalledTimes(2)
    })

    it('evicts cached lists when their combined serialized size exceeds the byte budget', async () => {
        const cache = await loadCache()
        const loader = vi.fn().mockResolvedValue([piece({ name: 'large', description: 'x'.repeat(25 * 1024 * 1024) })])

        await cache.loadList({ key: 'first', loader })
        await cache.loadList({ key: 'second', loader })
        await cache.loadList({ key: 'second', loader })
        expect(loader).toHaveBeenCalledTimes(2)
        await cache.loadList({ key: 'first', loader })
        expect(loader).toHaveBeenCalledTimes(3)
    })

    it('does not cache a serialized list larger than ninety-six MiB', async () => {
        const cache = await loadCache()
        const loader = vi.fn().mockResolvedValue([piece({
            name: 'large',
            description: 'x'.repeat(51 * 1024 * 1024),
        })])

        await cache.loadList({ key: 'large', loader })
        await cache.loadList({ key: 'large', loader })

        expect(loader).toHaveBeenCalledTimes(2)
    })

    it('waits for one of four pending fills before starting another', async () => {
        const cache = await loadCache()
        const gates = Array.from({ length: 4 }, deferred)
        const pending = gates.map((gate, index) => cache.loadList({
            key: `pending-${index}`,
            loader: async () => {
                await gate.promise
                return [piece({ name: `pending-${index}` })]
            },
        }))
        const fifth = vi.fn().mockResolvedValue([piece({ name: 'fifth' })])
        const request = cache.loadList({ key: 'pending-4', loader: fifth })

        await Promise.resolve()
        expect(fifth).not.toHaveBeenCalled()
        gates[0].resolve()
        await request
        gates.slice(1).forEach((gate) => gate.resolve())
        await Promise.all(pending)

        expect(fifth).toHaveBeenCalledTimes(1)
    })

    it('clears a rejected fill and bypasses caching in development and tests', async () => {
        const cache = await loadCache()
        const rejected = vi.fn().mockRejectedValueOnce(new Error('database failed'))
        const recovered = vi.fn().mockResolvedValue([piece({ name: 'recovered' })])

        await expect(cache.loadList({ key: 'rejected', loader: rejected })).rejects.toThrow('database failed')
        await cache.loadList({ key: 'rejected', loader: recovered })

        mocks.properties.set('DEV_PIECES', 'local-piece')
        const developmentCache = await loadCache()
        const developmentLoader = vi.fn().mockResolvedValue([piece({ name: 'development' })])
        await developmentCache.loadList({ key: 'development', loader: developmentLoader })
        await developmentCache.loadList({ key: 'development', loader: developmentLoader })

        mocks.properties.delete('DEV_PIECES')
        mocks.properties.set('ENVIRONMENT', ApEnvironment.TESTING)
        const testingCache = await loadCache()
        const testingLoader = vi.fn().mockResolvedValue([piece({ name: 'testing' })])
        await testingCache.loadList({ key: 'testing', loader: testingLoader })
        await testingCache.loadList({ key: 'testing', loader: testingLoader })

        expect(recovered).toHaveBeenCalledTimes(1)
        expect(developmentLoader).toHaveBeenCalledTimes(2)
        expect(testingLoader).toHaveBeenCalledTimes(2)
    })
})
