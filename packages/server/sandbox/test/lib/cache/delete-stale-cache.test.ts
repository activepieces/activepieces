import { randomUUID } from 'node:crypto'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cacheUtils, LATEST_CACHE_VERSION } from '../../../src/lib/cache/cache-paths'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const silentLog = { error: () => undefined, info: () => undefined, warn: () => undefined, debug: () => undefined } as any

afterEach(async () => {
    for (const root of roots) {
        await rm(root, { recursive: true, force: true })
    }
    roots.length = 0
})

describe('deleteStaleCache', () => {
    it('removes cache directories from previous versions and keeps the current one', async () => {
        const root = await makeCacheRoot(['v12', 'v13', LATEST_CACHE_VERSION])

        await cacheUtils(root).deleteStaleCache(silentLog)

        const remaining = await readdir(root)
        expect(remaining).toEqual([LATEST_CACHE_VERSION])
    })

    it('is a no-op when only the current version exists', async () => {
        const root = await makeCacheRoot([LATEST_CACHE_VERSION])

        await cacheUtils(root).deleteStaleCache(silentLog)

        const remaining = await readdir(root)
        expect(remaining).toEqual([LATEST_CACHE_VERSION])
    })
})
