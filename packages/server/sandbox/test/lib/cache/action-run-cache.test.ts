import { randomUUID } from 'node:crypto'
import { chmod, mkdir, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ActivepiecesError, apId, ApId, ErrorCode } from '@activepieces/core-utils'
import { ApLogger } from '@activepieces/server-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { actionRunCache, ACTION_RUN_CACHE_ACTIVE_WINDOW_MS, ACTION_RUN_CACHE_MAX_DIRS } from '../../../src/lib/cache/action-run-cache'
import { ACTION_RUN_CODE_DIR, cacheUtils } from '../../../src/lib/cache/cache-paths'

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

async function seedStepDir({ basePath, namespace, ageMs = 0, extraFiles = 0 }: SeedParams): Promise<string> {
    const dirPath = join(cacheUtils(basePath).getGlobalCodeCachePath(), namespace)
    const stepPath = join(dirPath, 'step_1')
    await mkdir(stepPath, { recursive: true })
    await writeFile(join(stepPath, 'index.js'), 'exports.code = async () => 42', 'utf8')
    await Promise.all(Array.from({ length: extraFiles }, (_, index) =>
        writeFile(join(stepPath, `dep_${index}.js`), 'module.exports = {}', 'utf8'),
    ))
    const mtime = new Date(Date.now() - ageMs)
    await utimes(dirPath, mtime, mtime)
    return dirPath
}

async function seedOldestFirst({ basePath, total, ageOffsetMs = ACTION_RUN_CACHE_ACTIVE_WINDOW_MS, label = '0' }: SeedOldestFirstParams): Promise<string[]> {
    return Promise.all(
        Array.from({ length: total }, (_, index) => seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: `${label}${index.toString(16)}`.padStart(64, '0') }),
            ageMs: ageOffsetMs + (total - index) * SECOND_MS,
        })),
    )
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

describe('actionRunCache.sweep', () => {
    it('reclaims managed dirs past the TTL and leaves flow versions alone', async () => {
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
            ageMs: 3 * HOUR_MS,
        })

        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(flowVersionDir)).resolves.toBe(true)
        await expect(exists(freshDir)).resolves.toBe(true)
        await expect(exists(expiredDir)).resolves.toBe(false)
    })

    it('cannot reach anything at the root of the code cache, however old, because it only reads its own directory', async () => {
        const basePath = uniqueBasePath()
        const codesPath = cacheUtils(basePath).getGlobalCodeCachePath()
        const ancient = 90 * 24 * HOUR_MS
        const flowVersionDir = await seedStepDir({ basePath, namespace: apId(), ageMs: ancient })
        const legacyPrefixedDir = await seedStepDir({ basePath, namespace: `ar_${apId()}_${'d'.repeat(64)}`, ageMs: ancient })
        const strayFile = join(codesPath, 'stray.txt')
        await writeFile(strayFile, 'not a cache dir', 'utf8')
        await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: 'e'.repeat(64) }),
            ageMs: ancient,
        })

        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(flowVersionDir)).resolves.toBe(true)
        await expect(exists(legacyPrefixedDir)).resolves.toBe(true)
        await expect(exists(strayFile)).resolves.toBe(true)
    })

    it('evicts only the oldest overflow once the managed dir count exceeds the cap', async () => {
        const basePath = uniqueBasePath()
        const overflow = 3
        const dirs = await seedOldestFirst({ basePath, total: ACTION_RUN_CACHE_MAX_DIRS + overflow })

        await actionRunCache.sweep({ basePath, log: noopLog })

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

        await actionRunCache.sweep({ basePath, log: noopLog })

        await expect(exists(dirs[0])).resolves.toBe(false)
        await expect(exists(dirs[firstRetained - 1])).resolves.toBe(false)
        await expect(exists(dirs[firstRetained])).resolves.toBe(true)
        await expect(exists(dirs[total - 1])).resolves.toBe(true)
    })

    it('stops eviction at the active-execution window, leaving the tree over the cap rather than deleting a live build', async () => {
        const basePath = uniqueBasePath()
        const staleDirs = await seedOldestFirst({ basePath, total: 3, label: 'a' })
        const activeDirs = await seedOldestFirst({ basePath, total: ACTION_RUN_CACHE_MAX_DIRS + 7, ageOffsetMs: 0, label: 'b' })

        await actionRunCache.sweep({ basePath, log: noopLog })

        for (const dirPath of staleDirs) {
            await expect(exists(dirPath)).resolves.toBe(false)
        }
        for (const dirPath of activeDirs) {
            await expect(exists(dirPath)).resolves.toBe(true)
        }
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

describe('actionRunCache.sweep observability', () => {
    it('reports a missing cache directory at debug, because a worker that never ran code has nothing to sweep', async () => {
        const basePath = uniqueBasePath()
        const recording = createRecordingLog()

        await actionRunCache.sweep({ basePath, log: recording.log })

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

        await actionRunCache.sweep({ basePath, log: recording.log })

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
        await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '3'.repeat(64) }),
        })
        const recording = createRecordingLog()

        await actionRunCache.sweep({ basePath, log: recording.log })

        expect(recording.payloadsAt('warn')).toHaveLength(0)
        expect(recording.payloadsAt('info')).toHaveLength(0)
        expect(recording.payloadsAt('debug')).toMatchObject([{ expiredCount: 0, evictedCount: 0, retainedCount: 1, failedCount: 0 }])
    })

    it('reports what it reclaimed at info', async () => {
        const basePath = uniqueBasePath()
        await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '4'.repeat(64) }),
            ageMs: 3 * HOUR_MS,
        })
        await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '5'.repeat(64) }),
        })
        const recording = createRecordingLog()

        await actionRunCache.sweep({ basePath, log: recording.log })

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
        const expiredDir = await seedStepDir({
            basePath,
            namespace: actionRunCache.namespace({ platformId: apId(), sourceHash: '6'.repeat(64) }),
            ageMs: 3 * HOUR_MS,
        })
        const recording = createRecordingLog()

        await chmod(actionRunsPath, 0o500)
        await actionRunCache.sweep({ basePath, log: recording.log })
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

describe('actionRunCache.touch', () => {
    it('advances the directory mtime so a reused build survives the next sweep', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: '8'.repeat(64) })
        const dirPath = await seedStepDir({ basePath, namespace, ageMs: 3 * HOUR_MS })

        await actionRunCache.touch(dirPath)
        await actionRunCache.sweep({ basePath, log: noopLog })

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
        const dirPath = await seedStepDir({ basePath, namespace })

        await expect(actionRunCache.settlePendingRemoval(dirPath)).resolves.toBe(false)
    })

    it('waits out a removal that is already past its mtime re-check, so a provision can rebuild instead of running deleted code', async () => {
        const basePath = uniqueBasePath()
        const namespace = actionRunCache.namespace({ platformId: apId(), sourceHash: 'b'.repeat(64) })
        const dirPath = await seedStepDir({ basePath, namespace, ageMs: 3 * HOUR_MS, extraFiles: 1000 })

        const sweeping = actionRunCache.sweep({ basePath, log: noopLog })
        const observed = await waitForPendingRemoval(dirPath)
        await sweeping

        expect(observed).toBe(true)
        await expect(exists(dirPath)).resolves.toBe(false)
        await expect(actionRunCache.settlePendingRemoval(dirPath)).resolves.toBe(false)
    })
})

type SeedParams = {
    basePath: string
    namespace: string
    ageMs?: number
    extraFiles?: number
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
