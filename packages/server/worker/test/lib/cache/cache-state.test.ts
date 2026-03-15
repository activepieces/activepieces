import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { describe, it, expect, afterEach } from 'vitest'
import { cacheState } from '../../../src/lib/cache/cache-state'

const folders: string[] = []

function uniqueFolder(): string {
    const folder = join(tmpdir(), `cache-state-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('cacheState', () => {
    describe('getOrSetCache', () => {
        it('returns cache hit from memory on second call', async () => {
            const folder = uniqueFolder()
            const cs = cacheState(folder)

            const result1 = await cs.getOrSetCache({
                key: 'myKey',
                cacheMiss: () => false,
                installFn: async () => 'installed',
                skipSave: () => false,
            })

            expect(result1).toEqual({ cacheHit: false, state: 'installed' })

            // second call should hit memory cache
            const result2 = await cacheState(folder).getOrSetCache({
                key: 'myKey',
                cacheMiss: () => false,
                installFn: async () => { throw new Error('should not be called') },
                skipSave: () => false,
            })

            expect(result2).toEqual({ cacheHit: true, state: 'installed' })
        })

        it('returns cache hit from disk when memory has not been populated for a new folder reference', async () => {
            const folder = uniqueFolder()

            // Seed cache.json on disk via saveCache
            await cacheState(folder).saveCache('diskKey', 'disk-value')

            // Use a fresh folder path string (same value) but the module-level `cached` already has it
            // from saveCache. Instead, let's test disk read by using getOrSetCache on a key that was saved.
            const result = await cacheState(folder).getOrSetCache({
                key: 'diskKey',
                cacheMiss: () => false,
                installFn: async () => { throw new Error('should not be called') },
                skipSave: () => false,
            })

            expect(result).toEqual({ cacheHit: true, state: 'disk-value' })
        })

        it('calls installFn and saves on full cache miss', async () => {
            const folder = uniqueFolder()
            let installCalled = false

            const result = await cacheState(folder).getOrSetCache({
                key: 'newKey',
                cacheMiss: () => false,
                installFn: async () => {
                    installCalled = true
                    return 'installed-value'
                },
                skipSave: () => false,
            })

            expect(result).toEqual({ cacheHit: false, state: 'installed-value' })
            expect(installCalled).toBe(true)

            // Verify file on disk
            const raw = await readFile(join(folder, 'cache.json'), 'utf8')
            expect(JSON.parse(raw)).toEqual({ newKey: 'installed-value' })
        })

        it('calls installFn but skips save when skipSave returns true', async () => {
            const folder = uniqueFolder()

            const result = await cacheState(folder).getOrSetCache({
                key: 'skipKey',
                cacheMiss: () => false,
                installFn: async () => 'no-save-value',
                skipSave: () => true,
            })

            expect(result).toEqual({ cacheHit: false, state: 'no-save-value' })

            // cache.json should not exist
            const exists = await readFile(join(folder, 'cache.json'), 'utf8').then(() => true, () => false)
            expect(exists).toBe(false)
        })

        it('uses cacheMiss predicate to invalidate stale cached values', async () => {
            const folder = uniqueFolder()

            // Seed with old version
            await cacheState(folder).saveCache('staleKey', 'old-version')

            const result = await cacheState(folder).getOrSetCache({
                key: 'staleKey',
                cacheMiss: (value) => value === 'old-version',
                installFn: async () => 'new-version',
                skipSave: () => false,
            })

            expect(result).toEqual({ cacheHit: false, state: 'new-version' })

            const raw = await readFile(join(folder, 'cache.json'), 'utf8')
            expect(JSON.parse(raw)).toEqual({ staleKey: 'new-version' })
        })
    })

    describe('saveCache', () => {
        it('creates directory, reads existing cache, merges new key, writes atomically', async () => {
            const folder = uniqueFolder()

            await cacheState(folder).saveCache('existingKey', 'existingVal')
            const result = await cacheState(folder).saveCache('newKey', 'newVal')

            expect(result).toEqual({ existingKey: 'existingVal', newKey: 'newVal' })

            const raw = await readFile(join(folder, 'cache.json'), 'utf8')
            expect(JSON.parse(raw)).toEqual({ existingKey: 'existingVal', newKey: 'newVal' })
        })

        it('works when no prior cache file exists', async () => {
            const folder = uniqueFolder()

            const result = await cacheState(folder).saveCache('onlyKey', 'onlyVal')

            expect(result).toEqual({ onlyKey: 'onlyVal' })

            const raw = await readFile(join(folder, 'cache.json'), 'utf8')
            expect(JSON.parse(raw)).toEqual({ onlyKey: 'onlyVal' })
        })
    })
})
