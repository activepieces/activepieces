import { randomUUID } from 'node:crypto'
import { chmod, mkdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ActivepiecesError, apId, ErrorCode } from '@activepieces/core-utils'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { ACTION_RUN_CODE_DIR, cacheUtils } from '../../../src/lib/cache/cache-paths'
import { ACTION_RUN_CACHE_ACTIVE_WINDOW_MS, ACTION_RUN_CACHE_MAX_DIRS, actionRunCache, codeCacheEviction, DISK_EVICTION_THRESHOLD_PERCENT } from '../../../src/lib/cache/code-cache-eviction'
import { pendingCacheRemovals } from '../../../src/lib/cache/pending-cache-removals'

const basePaths: string[] = []

function uniqueBasePath(): string {
    const basePath = join(tmpdir(), `code-cache-eviction-test-${randomUUID()}`)
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

function createRecordingLog(): RecordingLog {
    const calls: LogCall[] = []
    const record = (level: LogLevel) => (...args: unknown[]) => {
        calls.push({ level, payload: args[0] })
    }
    const log: ApLogger = {
        level: 'debug',
        silent: () => undefined,
        info: record('info'),
        warn: record('warn'),
        error: record('error'),
        fatal: record('fatal'),
        debug: record('debug'),
        trace: record('trace'),
        child: () => log,
    }
    return {
        log,
        payloadsAt: (level: LogLevel) => calls.filter((call) => call.level === level).map((call) => call.payload),
    }
}

const SECOND_MS = 1000
const HOUR_MS = 60 * 60 * 1000

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

// The disk-pressure pass calls getUsedPercent() once before the loop (the initial gate check) plus
// once per candidate considered, so driving N evictions needs N+1 "over threshold" answers.
function overThresholdForEvictions(evictionsWanted: number): () => Promise<number> {
    let overCallsLeft = evictionsWanted + 1
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

async function waitForPendingRemoval(dirPath: string): Promise<boolean> {
    const deadline = Date.now() + 10 * SECOND_MS
    while (Date.now() < deadline) {
        if (await actionRunCache.settlePendingRemoval(dirPath)) {
            return true
        }
        await new Promise((resolve) => setTimeout(resolve, 0))
    }
    return false
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

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

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

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(flowVersionCacheDir)).resolves.toBe(true)
        await expect(exists(legacyPrefixedDir)).resolves.toBe(true)
        await expect(exists(strayFile)).resolves.toBe(true)
    })

    it('evicts only the oldest overflow once the managed dir count exceeds the cap', async () => {
        const basePath = uniqueBasePath()
        const overflow = 3
        const dirs = await seedOldestFirst({ basePath, total: ACTION_RUN_CACHE_MAX_DIRS + overflow })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

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
        const dirs = await seedOldestFirst({ basePath, total })
        const firstRetained = total - ACTION_RUN_CACHE_MAX_DIRS

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(dirs[0])).resolves.toBe(false)
        await expect(exists(dirs[firstRetained - 1])).resolves.toBe(false)
        await expect(exists(dirs[firstRetained])).resolves.toBe(true)
        await expect(exists(dirs[total - 1])).resolves.toBe(true)
    })

    it('stops eviction at the active-execution window, leaving the tree over the cap rather than deleting a live build', async () => {
        const basePath = uniqueBasePath()
        const staleDirs = await seedOldestFirst({ basePath, total: 3, label: 'a' })
        const activeDirs = await seedOldestFirst({ basePath, total: ACTION_RUN_CACHE_MAX_DIRS + 7, ageOffsetMs: 0, label: 'b' })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        for (const dirPath of staleDirs) {
            await expect(exists(dirPath)).resolves.toBe(false)
        }
        for (const dirPath of activeDirs) {
            await expect(exists(dirPath)).resolves.toBe(true)
        }
    })

    it('widens the window to cover a run budget longer than 15 minutes, so a long code action is not evicted while it executes', async () => {
        const basePath = uniqueBasePath()
        const runningDirs = await seedOldestFirst({
            basePath,
            total: ACTION_RUN_CACHE_MAX_DIRS + 7,
            ageOffsetMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + 60_000,
            label: 'c',
        })

        await codeCacheEviction.sweep({ basePath, log: noopLog, activeWindowMs: 60 * 60 * 1000, getUsedPercent: underThreshold })

        for (const dirPath of runningDirs) {
            await expect(exists(dirPath)).resolves.toBe(true)
        }
    })

    it('is a no-op on a cache that was never created, and is idempotent', async () => {
        const basePath = uniqueBasePath()

        await expect(codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })).resolves.toBeUndefined()

        const freshDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '7'.repeat(64) }),
        })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })
        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(freshDir)).resolves.toBe(true)
    })
})

describe('codeCacheEviction.sweep action-run pass observability', () => {
    it('reports a missing cache directory at debug, because a worker that never ran code has nothing to sweep', async () => {
        const basePath = uniqueBasePath()
        const recording = createRecordingLog()

        await codeCacheEviction.sweep({ basePath, log: recording.log, getUsedPercent: underThreshold })

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

        await codeCacheEviction.sweep({ basePath, log: recording.log, getUsedPercent: underThreshold })

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

        await codeCacheEviction.sweep({ basePath, log: recording.log, getUsedPercent: underThreshold })

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

        await codeCacheEviction.sweep({ basePath, log: recording.log, getUsedPercent: underThreshold })

        expect(recording.payloadsAt('warn')).toHaveLength(0)
        expect(recording.payloadsAt('info')).toMatchObject([{
            expiredCount: 1,
            evictedCount: 0,
            retainedCount: 1,
            failedCount: 0,
            unreadableCount: 0,
        }])
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
        await codeCacheEviction.sweep({ basePath, log: recording.log, getUsedPercent: underThreshold })
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

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(oldStep)).resolves.toBe(true)
    })

    it('evicts the oldest step caches first once disk usage is over the threshold', async () => {
        const basePath = uniqueBasePath()
        const oldest = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 3 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const middle = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const newest = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(1) })

        await expect(exists(oldest)).resolves.toBe(false)
        await expect(exists(middle)).resolves.toBe(true)
        await expect(exists(newest)).resolves.toBe(true)
    })

    it('stops evicting as soon as disk usage drops back under the threshold', async () => {
        const basePath = uniqueBasePath()
        const steps = await Promise.all(Array.from({ length: 5 }, (_, index) =>
            seedStepDir({
                basePath,
                flowVersionId: apId(),
                ageMs: ACTION_RUN_CACHE_ACTIVE_WINDOW_MS + (5 - index) * 1000,
            }),
        ))

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(2) })

        await expect(exists(steps[0])).resolves.toBe(false)
        await expect(exists(steps[1])).resolves.toBe(false)
        for (const stepPath of steps.slice(2)) {
            await expect(exists(stepPath)).resolves.toBe(true)
        }
    })

    it('leaves a recently-used step cache alone even when disk usage is over the threshold', async () => {
        const basePath = uniqueBasePath()
        const activeStep = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(10) })

        await expect(exists(activeStep)).resolves.toBe(true)
    })

    it('evicts only the least-active step in a flow version, leaving its active steps and the flow-version dir intact', async () => {
        const basePath = uniqueBasePath()
        const flowVersionId = apId()
        const coldStep = await seedStepDir({ basePath, flowVersionId, stepName: 'cold_step', ageMs: 3 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })
        const hotStep = await seedStepDir({ basePath, flowVersionId, stepName: 'hot_step', ageMs: 1000 })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(1) })

        await expect(exists(coldStep)).resolves.toBe(false)
        await expect(exists(hotStep)).resolves.toBe(true)
        await expect(exists(flowVersionDir({ basePath, flowVersionId }))).resolves.toBe(true)
    })

    it('never touches the action-runs namespace, which the action-run pass already manages', async () => {
        const basePath = uniqueBasePath()
        const actionRunNamespace = actionRunCache.namespace({ platformId: apId(), sourceHash: 'f'.repeat(64) })
        const actionRunDir = await seedNamespaceDir({
            basePath,
            namespace: actionRunNamespace,
            ageMs: HOUR_MS,
        })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(10) })

        await expect(exists(actionRunDir)).resolves.toBe(true)
    })

    it('does nothing when the code cache directory does not exist yet', async () => {
        const basePath = uniqueBasePath()

        await expect(codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(10) }))
            .resolves.toBeUndefined()
    })

    it('clears a removed directory from pendingCacheRemovals once eviction finishes, so provisioning is never left waiting forever', async () => {
        const basePath = uniqueBasePath()
        const stepPath = await seedStepDir({ basePath, flowVersionId: apId(), ageMs: 2 * ACTION_RUN_CACHE_ACTIVE_WINDOW_MS })

        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: overThresholdForEvictions(1) })

        await expect(exists(stepPath)).resolves.toBe(false)
        await expect(pendingCacheRemovals.settle(stepPath)).resolves.toBe(false)
    })

    it('by default reads disk usage from basePath itself (statfs), not a hardcoded path — a nonexistent basePath is treated as 0% used rather than falling back to "/"', async () => {
        const basePath = join(tmpdir(), `code-cache-eviction-test-missing-${randomUUID()}`)

        await expect(codeCacheEviction.sweep({ basePath, log: noopLog })).resolves.toBeUndefined()
    })
})

describe('actionRunCache.touch', () => {
    it('advances the directory mtime so a reused build survives the next sweep', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: '8'.repeat(64) })
        const dirPath = await seedNamespaceDir({ basePath, namespace, ageMs: 3 * HOUR_MS })

        await actionRunCache.touch(dirPath)
        await codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })

        await expect(exists(dirPath)).resolves.toBe(true)
    })

    it('does not throw when the directory is already gone', async () => {
        const basePath = uniqueBasePath()

        await expect(actionRunCache.touch(join(basePath, 'missing'))).resolves.toBeUndefined()
    })
})

describe('actionRunCache.settlePendingRemoval', () => {
    it('reports nothing pending for a directory no sweep is touching', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: '9'.repeat(64) })
        const dirPath = await seedNamespaceDir({ basePath, namespace })

        await expect(actionRunCache.settlePendingRemoval(dirPath)).resolves.toBe(false)
    })

    it('waits out a removal that is already past its mtime re-check, so a provision can rebuild instead of running deleted code', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: 'b'.repeat(64) })
        const dirPath = await seedNamespaceDir({ basePath, namespace, ageMs: 3 * HOUR_MS, extraFiles: 1000 })

        const sweeping = codeCacheEviction.sweep({ basePath, log: noopLog, getUsedPercent: underThreshold })
        const observed = await waitForPendingRemoval(dirPath)
        await sweeping

        expect(observed).toBe(true)
        await expect(exists(dirPath)).resolves.toBe(false)
        await expect(actionRunCache.settlePendingRemoval(dirPath)).resolves.toBe(false)
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

type LogLevel = 'info' | 'warn' | 'error' | 'fatal' | 'debug' | 'trace'

type LogCall = {
    level: LogLevel
    payload: unknown
}

type RecordingLog = {
    log: ApLogger
    payloadsAt: (level: LogLevel) => unknown[]
}
