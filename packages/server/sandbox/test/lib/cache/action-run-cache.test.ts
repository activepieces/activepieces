import { randomUUID } from 'node:crypto'
import { mkdir, rm, stat, truncate, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ActivepiecesError, apId, ErrorCode } from '@activepieces/core-utils'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { actionRunCache } from '../../../src/lib/cache/action-run-cache'
import { cacheUtils } from '../../../src/lib/cache/cache-paths'

const basePaths: string[] = []

function uniqueBasePath(): string {
    const basePath = join(tmpdir(), `action-run-cache-test-${randomUUID()}`)
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

const HOUR_MS = 60 * 60 * 1000

async function seedStepDir({ basePath, namespace, ageMs = 0, sizeBytes = 0 }: SeedParams): Promise<string> {
    const dirPath = join(cacheUtils(basePath).getGlobalCodeCachePath(), namespace)
    const stepPath = join(dirPath, 'step_1')
    await mkdir(stepPath, { recursive: true })
    await writeFile(join(stepPath, 'index.js'), 'exports.code = async () => 42', 'utf8')
    if (sizeBytes > 0) {
        await truncate(join(stepPath, 'index.js'), sizeBytes)
    }
    const mtime = new Date(Date.now() - ageMs)
    await utimes(dirPath, mtime, mtime)
    return dirPath
}

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

describe('actionRunCache.namespace', () => {
    it('prefixes the platform so two platforms never share a directory for identical source', () => {
        const sourceHash = 'a'.repeat(64)
        const platformA = apId()
        const platformB = apId()

        const nameA = actionRunCache.namespace({ platformId: platformA, sourceHash })
        const nameB = actionRunCache.namespace({ platformId: platformB, sourceHash })

        expect(nameA).toBe(`ar_${platformA}_${sourceHash}`)
        expect(nameA).not.toBe(nameB)
        expect(actionRunCache.isManagedDir(nameA)).toBe(true)
    })

    it('refuses to build a namespace without a platformId', () => {
        let thrown: unknown = null
        try {
            actionRunCache.namespace({ platformId: '', sourceHash: 'a'.repeat(64) })
        }
        catch (error) {
            thrown = error
        }

        expect(thrown).toBeInstanceOf(ActivepiecesError)
        if (thrown instanceof ActivepiecesError) {
            expect(thrown.error.code).toBe(ErrorCode.VALIDATION)
            expect(thrown.error.params).toMatchObject({ message: expect.stringContaining('platformId') })
        }
    })
})

describe('actionRunCache directory classification', () => {
    it('never claims a flow-version directory as managed or orphaned', () => {
        const flowVersionId = apId()

        expect(actionRunCache.isManagedDir(flowVersionId)).toBe(false)
        expect(actionRunCache.isOrphanedDir(flowVersionId)).toBe(false)
    })

    it('recognises both pre-fix action-run shapes as orphans', () => {
        expect(actionRunCache.isOrphanedDir('0123456789abcdef'.repeat(4))).toBe(true)
        expect(actionRunCache.isOrphanedDir('mcp-flow-version-id')).toBe(true)
        expect(actionRunCache.isOrphanedDir('z'.repeat(64))).toBe(false)
        expect(actionRunCache.isOrphanedDir('0123456789abcdef'.repeat(3))).toBe(false)
    })
})

describe('actionRunCache.sweep', () => {
    it('reclaims expired managed dirs and both orphan shapes, and leaves flow versions alone', async () => {
        const basePath = uniqueBasePath()
        const flowVersionDir = await seedStepDir({ basePath, namespace: apId(), ageMs: 90 * 24 * HOUR_MS })
        const freshDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '1'.repeat(64) }),
            ageMs: HOUR_MS,
        })
        const expiredDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '2'.repeat(64) }),
            ageMs: 25 * HOUR_MS,
        })
        const hashOrphanDir = await seedStepDir({ basePath, namespace: '3'.repeat(64) })
        const constantOrphanDir = await seedStepDir({ basePath, namespace: 'mcp-flow-version-id' })

        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(flowVersionDir)).resolves.toBe(true)
        await expect(exists(freshDir)).resolves.toBe(true)
        await expect(exists(expiredDir)).resolves.toBe(false)
        await expect(exists(hashOrphanDir)).resolves.toBe(false)
        await expect(exists(constantOrphanDir)).resolves.toBe(false)
    })

    it('evicts oldest-first once the managed subtree exceeds the size budget', async () => {
        const basePath = uniqueBasePath()
        const oldestDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '4'.repeat(64) }),
            ageMs: 3 * HOUR_MS,
            sizeBytes: 1_500_000_000,
        })
        const middleDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '5'.repeat(64) }),
            ageMs: 2 * HOUR_MS,
            sizeBytes: 1_500_000_000,
        })
        const newestDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '6'.repeat(64) }),
            ageMs: HOUR_MS,
            sizeBytes: 1_500_000_000,
        })

        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(oldestDir)).resolves.toBe(false)
        await expect(exists(middleDir)).resolves.toBe(false)
        await expect(exists(newestDir)).resolves.toBe(true)
    })

    it('is a no-op on a cache that was never created, and is idempotent', async () => {
        const basePath = uniqueBasePath()

        await expect(actionRunCache.sweep({ basePath, log: noopLog })).resolves.toBeUndefined()

        const freshDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '7'.repeat(64) }),
        })

        await actionRunCache.sweep({ basePath, log: noopLog })
        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(freshDir)).resolves.toBe(true)
    })
})

describe('actionRunCache.touch', () => {
    it('advances the directory mtime so a reused build survives the next sweep', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: '8'.repeat(64) })
        const dirPath = await seedStepDir({ basePath, namespace, ageMs: 25 * HOUR_MS })

        await actionRunCache.touch(dirPath)
        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(dirPath)).resolves.toBe(true)
    })

    it('does not throw when the directory is already gone', async () => {
        const basePath = uniqueBasePath()

        await expect(actionRunCache.touch(join(basePath, 'missing'))).resolves.toBeUndefined()
    })
})

type SeedParams = {
    basePath: string
    namespace: string
    ageMs?: number
    sizeBytes?: number
}
