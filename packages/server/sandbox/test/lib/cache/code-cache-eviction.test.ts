import { randomUUID } from 'node:crypto'
import { chmod, mkdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ActivepiecesError, apId, ErrorCode } from '@activepieces/core-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { testLogger } from '../../helpers/logger'
import { ACTION_RUN_CODE_DIR, cacheUtils } from '../../../src/lib/cache/cache-paths'
import { ACTION_RUN_CACHE_ACTIVE_WINDOW_MS, ACTION_RUN_CACHE_MAX_DIRS, actionRunCache, codeCacheEviction, DISK_EVICTION_THRESHOLD_PERCENT } from '../../../src/lib/cache/code-cache-eviction'

const basePaths: string[] = []

function uniqueBasePath(): string {
    const basePath = join(tmpdir(), `code-cache-eviction-test-${randomUUID()}`)
    basePaths.push(basePath)
    return basePath
}

const noopLog = testLogger.noop
const createRecordingLog = testLogger.createRecording

const SECOND_MS = 1000
const HOUR_MS = 60 * 60 * 1000
const CAP_EVICTION_WINDOW_MS = 15 * 60 * 1000
const LARGE_TREE_TEST_TIMEOUT_MS = 30 * SECOND_MS

function flowVersionDir({ basePath, flowVersionId }: { basePath: string, flowVersionId: string }): string {
    return join(cacheUtils(basePath).getGlobalCodeCachePath(), flowVersionId)
}

async function seedNamespaceDir({ basePath, namespace, ageMs = 0, extraFiles = 0 }: SeedNamespaceParams): Promise<string> {
    const dirPath = join(cacheUtils(basePath).getGlobalCodeCachePath(), namespace)
    const stepPath = join(dirPath, 'step_1')
    await mkdir(stepPath, { recursive: true })
    await writeFile(join(stepPath, 'index.ts'), 'export const code = async () => 42', 'utf8')
    await Promise.all(Array.from({ length: extraFiles }, (_, index) =>
        writeFile(join(stepPath, `dep_${index}.js`), 'module.exports = {}', 'utf8'),
    ))
    const mtime = new Date(Date.now() - ageMs)
    await utimes(dirPath, mtime, mtime)
    return dirPath
}

async function seedStepDir({ basePath, flowVersionId, stepName = 'step_1', ageMs }: SeedStepParams): Promise<string> {
    const stepPath = join(flowVersionDir({ basePath, flowVersionId }), stepName)
    await mkdir(stepPath, { recursive: true })
    await writeFile(join(stepPath, 'index.ts'), 'export const code = async () => 42', 'utf8')
    const mtime = new Date(Date.now() - ageMs)
    await utimes(stepPath, mtime, mtime)
    return stepPath
}

async function seedOldestFirst({ basePath, total, ageOffsetMs = ACTION_RUN_CACHE_ACTIVE_WINDOW_MS, label = '0' }: SeedOldestFirstParams): Promise<string[]> {
    return Promise.all(
        Array.from({ length: total }, (_, index) => seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: `${label}${index.toString(16)}`.padStart(64, '0') }),
            ageMs: ageOffsetMs + (total - index) * SECOND_MS,
        })),
    )
}

function underThreshold(): Promise<number> {
    return Promise.resolve(DISK_EVICTION_THRESHOLD_PERCENT - 1)
}

function overThresholdForChecks(overChecks: number): () => Promise<number> {
    let overCallsLeft = overChecks
    return async () => {
        if (overCallsLeft <= 0) {
            return DISK_EVICTION_THRESHOLD_PERCENT - 1
        }
        overCallsLeft -= 1
        return DISK_EVICTION_THRESHOLD_PERCENT + 1
    }
}

function runningAsRoot(): boolean {
    return process.getuid?.() === 0
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
    for (const basePath of basePaths.splice(0)) {
        await rm(basePath, { recursive: true, force: true, maxRetries: 3 })
    }
})

describe('actionRunCache.namespace', () => {
    it('prefixes the platform so two platforms never share a directory for identical source', () => {
        const sourceHash = 'a'.repeat(64)
        const platformA = apId()
        const platformB = apId()

        const nameA = actionRunCache.namespace({ platformId: platformA, sourceHash })
        const nameB = actionRunCache.namespace({ platformId: platformB, sourceHash })

        expect(nameA).toBe(`${ACTION_RUN_CODE_DIR}/${platformA}_${sourceHash}`)
        expect(nameA).not.toBe(nameB)
        expect(actionRunCache.isActionRunNamespace(nameA)).toBe(true)
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

describe('actionRunCache namespace classification', () => {
    it('never claims a flow-version namespace, because an apId is a single path segment', () => {
        for (let attempt = 0; attempt < 100; attempt++) {
            expect(actionRunCache.isActionRunNamespace(apId())).toBe(false)
        }
    })

    it('uses a directory name no apId can produce, so a flow version can never land inside it', () => {
        expect(ACTION_RUN_CODE_DIR.length).not.toBe(apId().length)
    })
})

describe('codeCacheEviction.sweep action-run pass', () => {
    it('reclaims managed dirs past the TTL and leaves flow versions alone', async () => {
        const basePath = uniqueBasePath()
        const flowVersionCacheDir = await seedNamespaceDir({ basePath, namespace: apId(), ageMs: 90 * 24 * HOUR_MS })
        const freshDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '1'.repeat(64) }),
            ageMs: HOUR_MS,
        })
        const expiredDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '2'.repeat(64) }),
            ageMs: 3 * HOUR_MS,
        })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(flowVersionCacheDir)).resolves.toBe(true)
        await expect(exists(freshDir)).resolves.toBe(true)
        await expect(exists(expiredDir)).resolves.toBe(false)
    })

    it('cannot reach anything at the root of the code cache, however old, because it only reads its own directory', async () => {
        const basePath = uniqueBasePath()
        const codesPath = cacheUtils(basePath).getGlobalCodeCachePath()
        const ancient = 90 * 24 * HOUR_MS
        const flowVersionCacheDir = await seedNamespaceDir({ basePath, namespace: apId(), ageMs: ancient })
        const legacyPrefixedDir = await seedNamespaceDir({ basePath, namespace: `ar_${apId()}_${'d'.repeat(64)}`, ageMs: ancient })
        const strayFile = join(codesPath, 'stray.txt')
        await writeFile(strayFile, 'not a cache dir', 'utf8')
        await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: 'e'.repeat(64) }),
            ageMs: ancient,
        })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(flowVersionCacheDir)).resolves.toBe(true)
        await expect(exists(legacyPrefixedDir)).resolves.toBe(true)
        await expect(exists(strayFile)).resolves.toBe(true)
    })

    it('evicts only the oldest overflow once the managed dir count exceeds the cap', async () => {
        const basePath = uniqueBasePath()
        const overflow = 3
        const dirs = await seedOldestFirst({ basePath, total: ACTION_RUN_CACHE_MAX_DIRS + overflow, ageOffsetMs: CAP_EVICTION_WINDOW_MS })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, activeWindowMs: CAP_EVICTION_WINDOW_MS, getUsedPercent: underThreshold })

        for (const dirPath of dirs.slice(0, overflow)) {
            await expect(exists(dirPath)).resolves.toBe(false)
        }
        for (const dirPath of dirs.slice(overflow)) {
            await expect(exists(dirPath)).resolves.toBe(true)
        }
    })

    it('retains exactly the newest ACTION_RUN_CACHE_MAX_DIRS however far over the cap the tree runs', async () => {
        const basePath = uniqueBasePath()
        const total = ACTION_RUN_CACHE_MAX_DIRS * 3
        const dirs = await seedOldestFirst({ basePath, total, ageOffsetMs: CAP_EVICTION_WINDOW_MS })
        const firstRetained = total - ACTION_RUN_CACHE_MAX_DIRS

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, activeWindowMs: CAP_EVICTION_WINDOW_MS, getUsedPercent: underThreshold })

        await expect(exists(dirs[0])).resolves.toBe(false)
        await expect(exists(dirs[firstRetained - 1])).resolves.toBe(false)
        await expect(exists(dirs[firstRetained])).resolves.toBe(true)
        await expect(exists(dirs[total - 1])).resolves.toBe(true)
    }, LARGE_TREE_TEST_TIMEOUT_MS)

    it('stops eviction at the active-execution window, leaving the tree over the cap rather than deleting a live build', async () => {
        const basePath = uniqueBasePath()
        const staleDirs = await seedOldestFirst({ basePath, total: 3, label: 'a' })
        const activeDirs = await seedOldestFirst({ basePath, total: ACTION_RUN_CACHE_MAX_DIRS + 7, ageOffsetMs: 0, label: 'b' })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })

        for (const dirPath of staleDirs) {
            await expect(exists(dirPath)).resolves.toBe(false)
        }
        for (const dirPath of activeDirs) {
            await expect(exists(dirPath)).resolves.toBe(true)
        }
    })

    it('widens the window via an explicit override, so a long code action is not evicted while it executes', async () => {
        const basePath = uniqueBasePath()
        const runningDirs = await seedOldestFirst({
            basePath,
            total: ACTION_RUN_CACHE_MAX_DIRS + 7,
            ageOffsetMs: CAP_EVICTION_WINDOW_MS + 5 * 60 * 1000,
            label: 'c',
        })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, activeWindowMs: 60 * 60 * 1000, getUsedPercent: underThreshold })

        for (const dirPath of runningDirs) {
            await expect(exists(dirPath)).resolves.toBe(true)
        }
    })

    it('is a no-op on a cache that was never created, and is idempotent', async () => {
        const basePath = uniqueBasePath()

        await expect(codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })).resolves.toBeUndefined()

        const freshDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '7'.repeat(64) }),
        })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })
        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(freshDir)).resolves.toBe(true)
    })
})

describe('codeCacheEviction.sweep action-run pass observability', () => {
    it('reports a missing cache directory at debug, because a worker that never ran code has nothing to sweep', async () => {
        const basePath = uniqueBasePath()
        const recording = createRecordingLog()

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: underThreshold })

        expect(recording.payloadsAt('warn')).toHaveLength(0)
        expect(recording.payloadsAt('info')).toHaveLength(0)
        expect(recording.payloadsAt('debug')).toHaveLength(1)
    })

    it('warns with the errno when the cache directory cannot be read at all', async () => {
        const basePath = uniqueBasePath()
        const actionRunsPath = cacheUtils(basePath).getActionRunCodeCachePath()
        await mkdir(dirname(actionRunsPath), { recursive: true })
        await writeFile(actionRunsPath, 'not a directory', 'utf8')
        const recording = createRecordingLog()

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: underThreshold })

        const warnings = recording.payloadsAt('warn')
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toMatchObject({
            cache: { path: actionRunsPath },
            error: expect.objectContaining({ code: 'ENOTDIR' }),
        })
        expect(recording.payloadsAt('debug')).toHaveLength(0)
    })

    it('stays at debug when a sweep under the cap had nothing to reclaim', async () => {
        const basePath = uniqueBasePath()
        await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '3'.repeat(64) }),
        })
        const recording = createRecordingLog()

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: underThreshold })

        expect(recording.payloadsAt('warn')).toHaveLength(0)
        expect(recording.payloadsAt('info')).toHaveLength(0)
        expect(recording.payloadsAt('debug')).toMatchObject([{ expiredCount: 0, evictedCount: 0, retainedCount: 1, failedCount: 0 }])
    })

    it('reports what it reclaimed at info', async () => {
        const basePath = uniqueBasePath()
        await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '4'.repeat(64) }),
            ageMs: 3 * HOUR_MS,
        })
        await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '5'.repeat(64) }),
        })
        const recording = createRecordingLog()

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: underThreshold })

        expect(recording.payloadsAt('warn')).toHaveLength(0)
        expect(recording.payloadsAt('info')).toMatchObject([{
            expiredCount: 1,
            evictedCount: 0,
            retainedCount: 1,
            failedCount: 0,
            unreadableCount: 0,
        }])
    })

    it('counts an expired directory whose lock another sweeper holds as skipped, not silently as retained', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: 'c'.repeat(64) })
        const dirPath = await seedNamespaceDir({ basePath, namespace, ageMs: 3 * HOUR_MS })
        const recording = createRecordingLog()

        let releaseLock!: () => void
        const lockHeld = new Promise<void>((resolve) => {
            releaseLock = resolve
        })
        let signalAcquired!: () => void
        const lockAcquired = new Promise<void>((resolve) => {
            signalAcquired = resolve
        })
        const concurrentSweeper = codeCacheEviction.withDirLock({
            basePath,
            dirPath,
            fn: async () => {
                signalAcquired()
                await lockHeld
            },
        })
        await lockAcquired

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: underThreshold })

        releaseLock()
        await concurrentSweeper

        await expect(exists(dirPath)).resolves.toBe(true)
        expect(recording.payloadsAt('debug')).toMatchObject([{ expiredCount: 0, failedCount: 0, skippedCount: 1 }])
    })

    it.skipIf(runningAsRoot())('warns and counts the directory as retained when removal is denied', async () => {
        const basePath = uniqueBasePath()
        const actionRunsPath = cacheUtils(basePath).getActionRunCodeCachePath()
        const expiredDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '6'.repeat(64) }),
            ageMs: 3 * HOUR_MS,
        })
        const recording = createRecordingLog()

        await chmod(actionRunsPath, 0o500)
        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: underThreshold })
        await chmod(actionRunsPath, 0o700)

        await expect(exists(expiredDir)).resolves.toBe(true)
        expect(recording.payloadsAt('info')).toHaveLength(0)
        expect(recording.payloadsAt('warn')).toMatchObject([{
            expiredCount: 0,
            failedCount: 1,
            retainedCount: 1,
        }])
    })
})

describe('codeCacheEviction.sweep disk-pressure pass', () => {
    it('does nothing while disk usage is under the threshold', async () => {
        const basePath = uniqueBasePath()
        const oldStep = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 30 * 24 * HOUR_MS })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(oldStep)).resolves.toBe(true)
    })

    it('evicts the oldest step caches first once disk usage is over the threshold, re-checking usage every ten removals', async () => {
        const basePath = uniqueBasePath()
        const steps = await Promise.all(Array.from({ length: 12 }, (_, index) =>
            seedStepDir({
                basePath,
                flowVersionId: apId(),
                ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + (12 - index) * 1000,
            }),
        ))

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(1) })

        for (const stepPath of steps.slice(0, 10)) {
            await expect(exists(stepPath)).resolves.toBe(false)
        }
        for (const stepPath of steps.slice(10)) {
            await expect(exists(stepPath)).resolves.toBe(true)
        }
    })

    it('stops evicting as soon as a usage re-check drops back under the threshold', async () => {
        const basePath = uniqueBasePath()
        const steps = await Promise.all(Array.from({ length: 25 }, (_, index) =>
            seedStepDir({
                basePath,
                flowVersionId: apId(),
                ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + (25 - index) * 1000,
            }),
        ))

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(2) })

        for (const stepPath of steps.slice(0, 20)) {
            await expect(exists(stepPath)).resolves.toBe(false)
        }
        for (const stepPath of steps.slice(20)) {
            await expect(exists(stepPath)).resolves.toBe(true)
        }
    })

    it('leaves a recently-used step cache alone even when disk usage is over the threshold', async () => {
        const basePath = uniqueBasePath()
        const activeStep = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 1000 })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(99) })

        await expect(exists(activeStep)).resolves.toBe(true)
    })

    it('evicts only the least-active step in a flow version, leaving its active steps and the flow-version dir intact', async () => {
        const basePath = uniqueBasePath()
        const flowVersionId = apId()
        const coldStep = await seedStepDir({ basePath, flowVersionId, stepName: 'cold_step', ageMs: 3 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const hotStep = await seedStepDir({ basePath, flowVersionId, stepName: 'hot_step', ageMs: 1000 })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(1) })

        await expect(exists(coldStep)).resolves.toBe(false)
        await expect(exists(hotStep)).resolves.toBe(true)
        await expect(exists(flowVersionDir({ basePath, flowVersionId }))).resolves.toBe(true)
    })

    it('evicts an action-run namespace idle past the pressure floor even before its TTL expires', async () => {
        const basePath = uniqueBasePath()
        const actionRunDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: 'f'.repeat(64) }),
            ageMs: 90 * 60 * 1000,
        })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, activeWindowMs: CAP_EVICTION_WINDOW_MS, getUsedPercent: overThresholdForChecks(99) })

        await expect(exists(actionRunDir)).resolves.toBe(false)
    })

    it('leaves an action-run namespace idle for less than the pressure floor alone, even under pressure', async () => {
        const basePath = uniqueBasePath()
        const actionRunDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: 'f'.repeat(64) }),
            ageMs: 30 * 60 * 1000,
        })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, activeWindowMs: CAP_EVICTION_WINDOW_MS, getUsedPercent: overThresholdForChecks(99) })

        await expect(exists(actionRunDir)).resolves.toBe(true)
    })

    it('does nothing when the code cache directory does not exist yet', async () => {
        const basePath = uniqueBasePath()

        await expect(codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(99) }))
            .resolves.toBeUndefined()
    })

    it('reclaims an emptied flow-version dir on the next pressure sweep once it has gone idle', async () => {
        const basePath = uniqueBasePath()
        const flowVersionId = apId()
        const parentPath = flowVersionDir({ basePath, flowVersionId })
        const stepPath = await seedStepDir({ basePath, flowVersionId, ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(1) })
        await expect(exists(stepPath)).resolves.toBe(false)
        await expect(exists(parentPath)).resolves.toBe(true)

        const idle = new Date(Date.now() - 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS)
        await utimes(parentPath, idle, idle)
        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(1) })

        await expect(exists(parentPath)).resolves.toBe(false)
    })

    it('leaves a freshly created empty flow-version dir alone under pressure, so a provision that just made it cannot lose it', async () => {
        const basePath = uniqueBasePath()
        const parentPath = flowVersionDir({ basePath, flowVersionId: apId() })
        await mkdir(parentPath, { recursive: true })

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(99) })

        await expect(exists(parentPath)).resolves.toBe(true)
    })

    it('never treats a dir holding only stray files as evictable, and still raises the no-evictable warn', async () => {
        const basePath = uniqueBasePath()
        const parentPath = flowVersionDir({ basePath, flowVersionId: apId() })
        await mkdir(parentPath, { recursive: true })
        const strayFile = join(parentPath, 'stray.txt')
        await writeFile(strayFile, 'not a step dir', 'utf8')
        const idle = new Date(Date.now() - 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS)
        await utimes(parentPath, idle, idle)
        const recording = createRecordingLog()

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: overThresholdForChecks(99) })

        await expect(exists(strayFile)).resolves.toBe(true)
        expect(recording.payloadsAt('warn')).toMatchObject([{ candidateCount: 0, skippedCount: 0 }])
    })

    it('skips an empty shell that gains a step between the scan and its removal, keeping the new step intact', async () => {
        const basePath = uniqueBasePath()
        const steps = await Promise.all(Array.from({ length: 10 }, (_, index) =>
            seedStepDir({
                basePath,
                flowVersionId: apId(),
                ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + (10 - index) * 1000,
            }),
        ))
        const shellPath = flowVersionDir({ basePath, flowVersionId: apId() })
        await mkdir(shellPath, { recursive: true })
        const shellIdle = new Date(Date.now() - ACTION_RUN_CACHE_ACTIVE_WINDOW_MS - 1000)
        await utimes(shellPath, shellIdle, shellIdle)
        const lateStepPath = join(shellPath, 'late_step')

        let usageCalls = 0
        const getUsedPercent = async (): Promise<number> => {
            usageCalls += 1
            if (usageCalls === 2) {
                await mkdir(lateStepPath, { recursive: true })
            }
            return DISK_EVICTION_THRESHOLD_PERCENT + 1
        }

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent })

        for (const stepPath of steps) {
            await expect(exists(stepPath)).resolves.toBe(false)
        }
        await expect(exists(shellPath)).resolves.toBe(true)
        await expect(exists(lateStepPath)).resolves.toBe(true)
    })

    it.skipIf(runningAsRoot())('reports a lock-infrastructure failure on the locks directory as a warning, never as a candidate merely in use', async () => {
        const basePath = uniqueBasePath()
        const stepPath = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const locksPath = join(cacheUtils(basePath).getGlobalCachePathLatestVersion(), 'code-cache-locks')
        await mkdir(locksPath, { recursive: true })
        const recording = createRecordingLog()

        await chmod(locksPath, 0o500)
        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: recording.log, getUsedPercent: overThresholdForChecks(99) })
        await chmod(locksPath, 0o700)

        await expect(exists(stepPath)).resolves.toBe(true)
        expect(recording.payloadsAt('warn')).toMatchObject([{ error: expect.objectContaining({ code: 'EACCES' }) }])
    })

    it('skips a candidate whose directory lock is held by a concurrent provision, then evicts it once released', async () => {
        const basePath = uniqueBasePath()
        const stepPath = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })

        let releaseLock!: () => void
        const lockHeld = new Promise<void>((resolve) => {
            releaseLock = resolve
        })
        let signalAcquired!: () => void
        const lockAcquired = new Promise<void>((resolve) => {
            signalAcquired = resolve
        })
        const provisioning = codeCacheEviction.withDirLock({
            basePath,
            dirPath: stepPath,
            fn: async () => {
                signalAcquired()
                await lockHeld
            },
        })
        await lockAcquired

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(99) })
        await expect(exists(stepPath)).resolves.toBe(true)

        releaseLock()
        await provisioning

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(99) })
        await expect(exists(stepPath)).resolves.toBe(false)
    })

    it('by default reads disk usage from basePath itself, not a hardcoded path — a nonexistent basePath is treated as 0% used rather than falling back to "/"', async () => {
        const basePath = join(tmpdir(), `code-cache-eviction-test-missing-${randomUUID()}`)

        await expect(codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog })).resolves.toBeUndefined()
    })

    it('pauses between eviction batches so a long sweep does not peg the CPU in a tight loop', async () => {
        const basePath = uniqueBasePath()
        await Promise.all(Array.from({ length: 11 }, (_, index) =>
            seedStepDir({
                basePath,
                flowVersionId: apId(),
                ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + (11 - index) * 1000,
            }),
        ))
        const pauseMs = 150

        const startedAt = Date.now()
        await codeCacheEviction.sweep({ basePath, pauseMs, log: noopLog, getUsedPercent: overThresholdForChecks(99) })

        expect(Date.now() - startedAt).toBeGreaterThanOrEqual(pauseMs)
    })

    it('skips its disk-pressure scan while another process already holds the sweep lock, avoiding a redundant readdir storm across the fleet', async () => {
        const basePath = uniqueBasePath()
        const stepPath = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })

        let releaseHolder!: () => void
        const holderReleased = new Promise<void>((resolve) => {
            releaseHolder = resolve
        })
        let signalHolding!: () => void
        const holding = new Promise<void>((resolve) => {
            signalHolding = resolve
        })
        const holder = codeCacheEviction.withDirLock({
            basePath,
            dirPath: 'disk-pressure-sweep',
            fn: async () => {
                signalHolding()
                await holderReleased
            },
        })
        await holding

        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: overThresholdForChecks(99) })

        releaseHolder()
        await holder

        await expect(exists(stepPath)).resolves.toBe(true)
    })
})

describe('codeCacheEviction.markUsed', () => {
    it('advances the directory mtime so a reused build survives the next sweep', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: '8'.repeat(64) })
        const dirPath = await seedNamespaceDir({ basePath, namespace, ageMs: 3 * HOUR_MS })

        await codeCacheEviction.markUsed(dirPath)
        await codeCacheEviction.sweep({ basePath, pauseMs: 0, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(dirPath)).resolves.toBe(true)
    })

    it('does not throw when the directory is already gone', async () => {
        const basePath = uniqueBasePath()

        await expect(codeCacheEviction.markUsed(join(basePath, 'missing'))).resolves.toBeUndefined()
    })
})

describe('codeCacheEviction.withDirLock', () => {
    it('blocks a provision on the same directory until the first holder finishes, and runs callers in acquisition order', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: '9'.repeat(64) })
        const dirPath = await seedNamespaceDir({ basePath, namespace })

        const order: string[] = []
        let releaseFirst!: () => void
        const firstHeld = new Promise<void>((resolve) => {
            releaseFirst = resolve
        })
        let signalAcquired!: () => void
        const firstAcquired = new Promise<void>((resolve) => {
            signalAcquired = resolve
        })
        const first = codeCacheEviction.withDirLock({
            basePath,
            dirPath,
            fn: async () => {
                signalAcquired()
                await firstHeld
                order.push('first')
            },
        })
        await firstAcquired
        const second = codeCacheEviction.withDirLock({
            basePath,
            dirPath,
            fn: async () => {
                order.push('second')
            },
        })

        releaseFirst()
        await Promise.all([first, second])

        expect(order).toEqual(['first', 'second'])
    })
})

type SeedNamespaceParams = {
    basePath: string
    namespace: string
    ageMs?: number
    extraFiles?: number
}

type SeedStepParams = {
    basePath: string
    flowVersionId: string
    stepName?: string
    ageMs: number
}

type SeedOldestFirstParams = {
    basePath: string
    total: number
    ageOffsetMs?: number
    label?: string
}
