import { randomUUID } from 'node:crypto'
import { mkdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { cacheEviction } from '../../../src/lib/cache/cache-eviction'
import { pendingCacheRemovals } from '../../../src/lib/cache/pending-cache-removals'

const basePaths: string[] = []

function uniqueBasePath(): string {
    const basePath = join(tmpdir(), `cache-eviction-test-${randomUUID()}`)
    basePaths.push(basePath)
    return basePath
}

function createNoopLog(): ApLogger {
    const log: ApLogger = {
        level: 'silent',
        silent: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
        child: () => log,
    }
    return log
}

const noopLog = createNoopLog()

async function exists(path: string): Promise<boolean> {
    try {
        await stat(path)
        return true
    }
    catch {
        return false
    }
}

afterEach(async () => {
    for (const basePath of basePaths) {
        await rm(basePath, { recursive: true, force: true })
    }
    basePaths.length = 0
})

describe('cacheEviction.listManagedDirs', () => {
    it('returns null without throwing when the parent directory does not exist', async () => {
        const parentPath = uniqueBasePath()

        await expect(cacheEviction.listManagedDirs({ parentPath, log: noopLog, cacheLabel: 'test' })).resolves.toBeNull()
    })

    it('lists only immediate subdirectories, never files or deeper entries', async () => {
        const parentPath = uniqueBasePath()
        await mkdir(join(parentPath, 'dir-a'), { recursive: true })
        await mkdir(join(parentPath, 'dir-b', 'nested'), { recursive: true })
        await writeFile(join(parentPath, 'a-file.txt'), 'not a dir', 'utf8')

        const dirs = await cacheEviction.listManagedDirs({ parentPath, log: noopLog, cacheLabel: 'test' })

        expect(dirs).not.toBeNull()
        expect(new Set(dirs)).toEqual(new Set([join(parentPath, 'dir-a'), join(parentPath, 'dir-b')]))
    })

    it('excludes subdirectories rejected by filterName', async () => {
        const parentPath = uniqueBasePath()
        await mkdir(join(parentPath, 'keep'), { recursive: true })
        await mkdir(join(parentPath, 'skip'), { recursive: true })

        const dirs = await cacheEviction.listManagedDirs({
            parentPath,
            log: noopLog,
            cacheLabel: 'test',
            filterName: (name) => name !== 'skip',
        })

        expect(dirs).toEqual([join(parentPath, 'keep')])
    })
})

describe('cacheEviction.readMtimeMs', () => {
    it('returns null for a path that does not exist, instead of throwing', async () => {
        await expect(cacheEviction.readMtimeMs(join(uniqueBasePath(), 'missing'))).resolves.toBeNull()
    })

    it('returns the real mtime for an existing path', async () => {
        const dirPath = uniqueBasePath()
        await mkdir(dirPath, { recursive: true })
        const mtime = new Date(Date.now() - 60_000)
        await utimes(dirPath, mtime, mtime)

        await expect(cacheEviction.readMtimeMs(dirPath)).resolves.toBe(mtime.getTime())
    })
})

describe('cacheEviction.removeDir', () => {
    it('removes a directory whose mtime still matches what was read', async () => {
        const dirPath = uniqueBasePath()
        await mkdir(dirPath, { recursive: true })
        const mtimeMs = (await stat(dirPath)).mtimeMs

        await expect(cacheEviction.removeDir({ dirPath, expectedMtimeMs: mtimeMs })).resolves.toBe('removed')
        await expect(exists(dirPath)).resolves.toBe(false)
    })

    it('skips removal when the directory was touched after being listed, instead of deleting something back in use', async () => {
        const dirPath = uniqueBasePath()
        await mkdir(dirPath, { recursive: true })
        const staleMtimeMs = (await stat(dirPath)).mtimeMs - 60_000

        await expect(cacheEviction.removeDir({ dirPath, expectedMtimeMs: staleMtimeMs })).resolves.toBe('skipped')
        await expect(exists(dirPath)).resolves.toBe(true)
    })

    it('skips a directory that is already gone instead of throwing', async () => {
        const dirPath = uniqueBasePath()

        await expect(cacheEviction.removeDir({ dirPath, expectedMtimeMs: 0 })).resolves.toBe('skipped')
    })

    it('tracks the removal in pendingCacheRemovals while in flight and clears it once done', async () => {
        const dirPath = uniqueBasePath()
        await mkdir(dirPath, { recursive: true })
        const mtimeMs = (await stat(dirPath)).mtimeMs

        const removal = cacheEviction.removeDir({ dirPath, expectedMtimeMs: mtimeMs })

        await removal
        await expect(pendingCacheRemovals.settle(dirPath)).resolves.toBe(false)
    })
})
