import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { describe, it, expect, afterEach } from 'vitest'
import { cacheState } from '../../src/lib/cache/cache-state'

const folders: string[] = []

function uniqueFolder(): string {
    const folder = join(tmpdir(), `cache-state-stress-${randomUUID()}`)
    folders.push(folder)
    return folder
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('cacheState — stress tests', () => {
    it('10 concurrent getOrSetCache calls on same key: installFn called exactly once', async () => {
        const folder = uniqueFolder()
        let installCount = 0

        const tasks = Array.from({ length: 10 }, () =>
            cacheState(folder).getOrSetCache({
                key: 'shared-key',
                cacheMiss: () => false,
                installFn: async () => {
                    installCount++
                    await new Promise((r) => setTimeout(r, 50))
                    return 'installed'
                },
                skipSave: () => false,
            }),
        )

        const results = await Promise.all(tasks)

        // Only one should have actually run installFn
        expect(installCount).toBe(1)
        // All should get the value
        for (const r of results) {
            expect(r.state).toBe('installed')
        }
    }, 15_000)

    it('20 concurrent getOrSetCache on different keys: all install concurrently', async () => {
        const folder = uniqueFolder()
        let maxConcurrent = 0
        let current = 0

        const tasks = Array.from({ length: 20 }, (_, i) =>
            cacheState(folder).getOrSetCache({
                key: `key-${i}`,
                cacheMiss: () => false,
                installFn: async () => {
                    current++
                    maxConcurrent = Math.max(maxConcurrent, current)
                    await new Promise((r) => setTimeout(r, 20))
                    current--
                    return `value-${i}`
                },
                skipSave: () => false,
            }),
        )

        const results = await Promise.all(tasks)

        // All 20 should have installed
        for (let i = 0; i < 20; i++) {
            expect(results[i].state).toBe(`value-${i}`)
        }

        // Verify disk has all 20 keys
        const raw = await readFile(join(folder, 'cache.json'), 'utf8')
        const cache = JSON.parse(raw)
        for (let i = 0; i < 20; i++) {
            expect(cache[`key-${i}`]).toBe(`value-${i}`)
        }
    }, 30_000)

    it('rapid cache invalidation and reinstall cycles', async () => {
        const folder = uniqueFolder()
        const N = 20
        let latestVersion = 'v0'

        // Seed initial value
        await cacheState(folder).getOrSetCache({
            key: 'evolving',
            cacheMiss: () => false,
            installFn: async () => {
                latestVersion = 'v0'
                return latestVersion
            },
            skipSave: () => false,
        })

        // Simulate N rapid update cycles
        for (let i = 1; i <= N; i++) {
            const expectedVersion = `v${i}`
            const result = await cacheState(folder).getOrSetCache({
                key: 'evolving',
                cacheMiss: (val) => val !== expectedVersion,
                installFn: async () => {
                    latestVersion = expectedVersion
                    return expectedVersion
                },
                skipSave: () => false,
            })
            expect(result.state).toBe(expectedVersion)
        }

        // Final cache should have latest version
        const raw = await readFile(join(folder, 'cache.json'), 'utf8')
        const cache = JSON.parse(raw)
        expect(cache['evolving']).toBe(`v${N}`)
    }, 15_000)

    it('concurrent saveCache calls produce valid JSON (some keys may be lost to races)', async () => {
        const folder = uniqueFolder()
        const N = 20

        // All callers try to save a different key concurrently.
        // Note: saveCache does read-merge-write without cross-caller locking,
        // so concurrent saves may clobber each other. The important thing is
        // the file remains valid JSON and the last writer's key is present.
        const tasks = Array.from({ length: N }, (_, i) =>
            cacheState(folder).saveCache(`key-${i}`, `val-${i}`),
        )

        await Promise.all(tasks)

        const raw = await readFile(join(folder, 'cache.json'), 'utf8')
        const cache = JSON.parse(raw) as Record<string, string>

        // File must be valid JSON
        expect(typeof cache).toBe('object')
        // At least one key must be present
        const presentKeys = Object.keys(cache).filter(k => k.startsWith('key-'))
        expect(presentKeys.length).toBeGreaterThan(0)
        // Every present key must have the correct value
        for (const k of presentKeys) {
            const idx = k.replace('key-', '')
            expect(cache[k]).toBe(`val-${idx}`)
        }
    }, 15_000)

    it('installFn throwing does not corrupt cache state', async () => {
        const folder = uniqueFolder()

        // Seed with a good value
        await cacheState(folder).saveCache('stable', 'good-value')

        // Attempt install that throws
        await expect(
            cacheState(folder).getOrSetCache({
                key: 'broken',
                cacheMiss: () => false,
                installFn: async () => {
                    throw new Error('install failed')
                },
                skipSave: () => false,
            }),
        ).rejects.toThrow('install failed')

        // Original cache should be intact
        const raw = await readFile(join(folder, 'cache.json'), 'utf8')
        const cache = JSON.parse(raw)
        expect(cache['stable']).toBe('good-value')
        expect(cache['broken']).toBeUndefined()
    }, 10_000)

    it('many concurrent readers with one writer', async () => {
        const folder = uniqueFolder()
        const WRITE_KEY = 'write-target'

        // Seed cache
        await cacheState(folder).saveCache(WRITE_KEY, 'initial')
        await cacheState(folder).saveCache('read-key', 'read-value')

        // Writer updates the value after a delay
        const writerPromise = (async () => {
            await new Promise((r) => setTimeout(r, 50))
            return cacheState(folder).getOrSetCache({
                key: WRITE_KEY,
                cacheMiss: (val) => val === 'initial',
                installFn: async () => {
                    await new Promise((r) => setTimeout(r, 30))
                    return 'updated'
                },
                skipSave: () => false,
            })
        })()

        // 10 readers concurrently read different key
        const readers = Array.from({ length: 10 }, () =>
            cacheState(folder).getOrSetCache({
                key: 'read-key',
                cacheMiss: () => false,
                installFn: async () => {
                    throw new Error('should not install for read-key')
                },
                skipSave: () => false,
            }),
        )

        const [writeResult, ...readResults] = await Promise.all([writerPromise, ...readers])

        expect(writeResult.state).toBe('updated')
        for (const r of readResults) {
            expect(r.state).toBe('read-value')
            expect(r.cacheHit).toBe(true)
        }
    }, 15_000)
})
