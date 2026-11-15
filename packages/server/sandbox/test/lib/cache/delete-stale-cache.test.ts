import { randomUUID } from 'node:crypto'
import { mkdir, readdir, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cacheUtils, LATEST_CACHE_VERSION, STALE_CACHE_GRACE_MS } from '../../../src/lib/cache/cache-paths'

const roots: string[] = []

async function makeCacheRoot(versions: string[]): Promise<string> {
    const root = join(tmpdir(), `stale-cache-test-${randomUUID()}`)
    roots.push(root)
    for (const version of versions) {
        await mkdir(join(root, version, 'common'), { recursive: true })
        await writeFile(join(root, version, 'common', 'main.js'), 'engine', 'utf8')
    }
    return root
}

async function ageCurrentVersion(root: string, ms: number): Promise<void> {
    const aged = new Date(Date.now() - ms)
    await utimes(join(root, LATEST_CACHE_VERSION), aged, aged)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const silentLog = { error: () => undefined, info: () => undefined, warn: () => undefined, debug: () => undefined } as any

afterEach(async () => {
    for (const root of roots) {
        await rm(root, { recursive: true, force: true })
    }
    roots.length = 0
})

describe('deleteStaleCache', () => {
    it('removes previous versions once the current one is past the grace period', async () => {
        const root = await makeCacheRoot(['v12', 'v13', LATEST_CACHE_VERSION])
        await ageCurrentVersion(root, STALE_CACHE_GRACE_MS + 1000)

        await cacheUtils(root).deleteStaleCache(silentLog)

        const remaining = await readdir(root)
        expect(remaining).toEqual([LATEST_CACHE_VERSION])
    })

    it('keeps previous versions while the current one is within the grace period', async () => {
        const root = await makeCacheRoot(['v13', LATEST_CACHE_VERSION])

        await cacheUtils(root).deleteStaleCache(silentLog)

        const remaining = await readdir(root)
        expect(remaining.sort()).toEqual(['v13', LATEST_CACHE_VERSION].sort())
    })

    it('keeps previous versions when the current one has never been used here', async () => {
        const root = await makeCacheRoot(['v13'])

        await cacheUtils(root).deleteStaleCache(silentLog)

        const remaining = await readdir(root)
        expect(remaining).toEqual(['v13'])
    })

    it('is a no-op when only the current version exists', async () => {
        const root = await makeCacheRoot([LATEST_CACHE_VERSION])

        await cacheUtils(root).deleteStaleCache(silentLog)

        const remaining = await readdir(root)
        expect(remaining).toEqual([LATEST_CACHE_VERSION])
    })
})
