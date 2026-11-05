import { readdir, rm, rmdir, stat, utimes } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { ActivepiecesError, chunk, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, systemUsage } from '@activepieces/server-utils'
import { diskLock, DiskLockTimeoutError } from '../utils/distributed-lock'
import { ACTION_RUN_CODE_DIR, cacheUtils } from './cache-paths'

export const actionRunCache = {
    namespace({ platformId, sourceHash }: NamespaceParams): string {
        if (platformId.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Cannot namespace an action-run code cache without a platformId' },
            })
        }
        return `${ACTION_RUN_CODE_DIR}/${platformId}_${sourceHash}`
    },

    isActionRunNamespace(namespace: string): boolean {
        return namespace.startsWith(`${ACTION_RUN_CODE_DIR}/`)
    },
}

export const codeCacheEviction = {
    async sweep({
        basePath,
        log,
        activeWindowMs = ACTION_RUN_CACHE_ACTIVE_WINDOW_MS,
        getUsedPercent = () => defaultGetUsedPercent({ basePath, log }),
        pauseMs = EVICTION_PAUSE_MS,
    }: SweepParams): Promise<void> {
        const locks = evictionLocks(basePath)
        await sweepActionRuns({ basePath, log, activeWindowMs, locks })
        await sweepOnDiskPressure({ basePath, log, activeWindowMs, getUsedPercent, locks, pauseMs })
    },

    async markUsed(dirPath: string): Promise<void> {
        const now = new Date()
        await tryCatch(() => utimes(dirPath, now, now))
    },

    async withDirLock<T>({ basePath, dirPath, fn }: WithDirLockParams<T>): Promise<T> {
        return evictionLocks(basePath).runExclusive({
            key: dirPath,
            timeoutMs: PROVISION_LOCK_TIMEOUT_MS,
            fn,
        })
    },
}

function evictionLocks(basePath: string): CacheLocks {
    return diskLock(path.join(cacheUtils(basePath).getGlobalCachePathLatestVersion(), CODE_CACHE_LOCKS_DIR))
}

async function sweepActionRuns({ basePath, log, activeWindowMs, locks }: ActionRunSweepParams): Promise<void> {
    const startedAt = Date.now()
    const actionRunsPath = cacheUtils(basePath).getActionRunCodeCachePath()
    const { data: entries, error } = await tryCatch(() => readdir(actionRunsPath, { withFileTypes: true }))
    if (error) {
        if ('code' in error && error.code === 'ENOENT') {
            log.debug({ cache: { path: actionRunsPath } }, 'Action-run code cache directory does not exist yet')
            return
        }
        log.warn({ error, cache: { path: actionRunsPath } }, 'Failed to read the action-run code cache directory')
        return
    }

    const managed = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(actionRunsPath, entry.name))

    const expired = await removeExpired({ dirPaths: managed, expiredAt: Date.now() - ACTION_RUN_CACHE_TTL_MS, locks })

    const activeAt = Date.now() - activeWindowMs
    const evictable = expired.survivors.filter((entry) => entry.mtimeMs < activeAt)
    const overBy = expired.survivors.length - ACTION_RUN_CACHE_MAX_DIRS
    const evicted = await removeAll({
        entries: overBy > 0
            ? [...evictable].sort((a, b) => a.mtimeMs - b.mtimeMs).slice(0, overBy)
            : [],
        locks,
    })

    const failedCount = expired.failedCount + evicted.failedCount
    const retainedCount = managed.length - expired.expiredCount - evicted.removedCount - expired.unreadableCount
    const summary = {
        expiredCount: expired.expiredCount,
        evictedCount: evicted.removedCount,
        retainedCount,
        activeCount: expired.survivors.length - evictable.length,
        failedCount,
        skippedCount: expired.skippedCount + evicted.skippedCount,
        unreadableCount: expired.unreadableCount,
        durationMs: Date.now() - startedAt,
    }
    if (failedCount > 0) {
        log.warn(summary, 'Action-run code cache sweep could not remove every expired directory')
        return
    }
    if (expired.expiredCount === 0 && evicted.removedCount === 0 && retainedCount <= ACTION_RUN_CACHE_MAX_DIRS) {
        log.debug(summary, 'Swept action-run code cache')
        return
    }
    log.info(summary, 'Swept action-run code cache')
}

async function sweepOnDiskPressure({ basePath, log, activeWindowMs, getUsedPercent, locks, pauseMs }: DiskPressureSweepParams): Promise<void> {
    const usedPercentBefore = await getUsedPercent()
    if (usedPercentBefore < DISK_EVICTION_THRESHOLD_PERCENT) {
        return
    }

    const { error: lockError } = await tryCatch(() => locks.runExclusive({
        key: DISK_PRESSURE_SWEEP_LOCK_KEY,
        timeoutMs: EVICTION_TRY_LOCK_TIMEOUT_MS,
        fn: () => runDiskPressureEviction({ basePath, log, activeWindowMs, getUsedPercent, locks, pauseMs, usedPercentBefore }),
    }))
    if (isNil(lockError)) {
        return
    }
    if (lockError instanceof DiskLockTimeoutError) {
        log.debug({ cache: { path: basePath } }, 'Another process is already sweeping the code cache under disk pressure, skipping this cycle')
        return
    }
    log.warn({ error: lockError }, 'Failed to acquire the disk-pressure sweep lock')
}

async function runDiskPressureEviction({ basePath, log, activeWindowMs, getUsedPercent, locks, pauseMs, usedPercentBefore }: RunDiskPressureEvictionParams): Promise<void> {
    const codesPath = cacheUtils(basePath).getGlobalCodeCachePath()
    const { data: entries, error } = await tryCatch(() => readdir(codesPath, { withFileTypes: true }))
    if (error) {
        if ('code' in error && error.code === 'ENOENT') {
            return
        }
        log.warn({ error, cache: { path: codesPath } }, 'Failed to read code cache directory for disk-usage eviction')
        return
    }

    const activeAt = Date.now() - activeWindowMs
    const flowVersionDirs = entries.filter((entry) => entry.isDirectory() && entry.name !== ACTION_RUN_CODE_DIR)
    const candidates: PressureCandidate[] = []
    for (const batch of chunk(flowVersionDirs, SCAN_BATCH_SIZE)) {
        const nested = await Promise.all(batch.map((entry) => readStepCandidates({
            flowVersionPath: path.join(codesPath, entry.name),
            activeAt,
        })))
        candidates.push(...nested.flat())
    }
    const actionRunActiveAt = Date.now() - Math.max(ACTION_RUN_PRESSURE_FLOOR_MS, activeWindowMs + PROVISION_LOCK_TIMEOUT_MS)
    candidates.push(...await readActionRunCandidates({ basePath, activeAt: actionRunActiveAt }))
    candidates.sort((a, b) => a.mtimeMs - b.mtimeMs)

    let evictedCount = 0
    let failedCount = 0
    let skippedCount = 0
    let lastUsedPercent = usedPercentBefore
    for (const [index, candidate] of candidates.entries()) {
        if (index % USAGE_RECHECK_EVERY === 0) {
            if (index > 0) {
                await sleep(pauseMs)
                lastUsedPercent = await getUsedPercent()
            }
            if (lastUsedPercent < DISK_EVICTION_THRESHOLD_PERCENT) {
                break
            }
        }
        const outcome = await removeDir({ locks, dirPath: candidate.dirPath, expectedMtimeMs: candidate.mtimeMs, emptyOnly: candidate.emptyShell })
        evictedCount += outcome === 'removed' ? 1 : 0
        failedCount += outcome === 'failed' ? 1 : 0
        skippedCount += outcome === 'skipped' ? 1 : 0
    }

    const usedPercentAfter = lastUsedPercent >= DISK_EVICTION_THRESHOLD_PERCENT ? await getUsedPercent() : lastUsedPercent
    const summary = {
        evictedCount,
        failedCount,
        skippedCount,
        candidateCount: candidates.length,
        usedPercentBefore,
        usedPercentAfter,
        maxUsedPercent: DISK_EVICTION_THRESHOLD_PERCENT,
    }
    if (failedCount > 0) {
        log.warn(summary, 'Code cache disk-usage eviction could not remove every candidate')
        return
    }
    if (evictedCount > 0) {
        log.info(summary, 'Evicted code cache directories to relieve disk pressure')
        return
    }
    if (usedPercentAfter >= DISK_EVICTION_THRESHOLD_PERCENT) {
        if (skippedCount > 0) {
            log.info(summary, 'Every code cache eviction candidate was in use during the sweep, retrying next cycle')
            return
        }
        log.warn(summary, 'Disk usage is above threshold but no evictable code cache directories were found')
    }
}

async function defaultGetUsedPercent({ basePath, log }: DefaultGetUsedPercentParams): Promise<number> {
    const diskInfo = await systemUsage.getDiskInfo(basePath)
    if (diskInfo.total === 0) {
        log.warn({ cache: { path: basePath } }, 'Disk usage read failed, disk-pressure code cache eviction is inactive')
        return 0
    }
    return diskInfo.percentage
}

async function readActionRunCandidates({ basePath, activeAt }: ReadActionRunCandidatesParams): Promise<PressureCandidate[]> {
    const actionRunsPath = cacheUtils(basePath).getActionRunCodeCachePath()
    const { data: entries, error } = await tryCatch(() => readdir(actionRunsPath, { withFileTypes: true }))
    if (error) {
        return []
    }
    const namespaceDirs = entries.filter((entry) => entry.isDirectory())
    const candidates: PressureCandidate[] = []
    for (const batch of chunk(namespaceDirs, SCAN_BATCH_SIZE)) {
        const stats = await Promise.all(batch.map(async (entry): Promise<PressureCandidate | null> => {
            const dirPath = path.join(actionRunsPath, entry.name)
            const mtimeMs = await readMtimeMs(dirPath)
            return isNil(mtimeMs) ? null : { dirPath, mtimeMs, emptyShell: false }
        }))
        candidates.push(...stats.filter((entry): entry is PressureCandidate => entry !== null && entry.mtimeMs < activeAt))
    }
    return candidates
}

async function readStepCandidates({ flowVersionPath, activeAt }: ReadStepCandidatesParams): Promise<PressureCandidate[]> {
    const { data: stepEntries, error } = await tryCatch(() => readdir(flowVersionPath, { withFileTypes: true }))
    if (error) {
        return []
    }
    if (stepEntries.length === 0) {
        const mtimeMs = await readMtimeMs(flowVersionPath)
        if (isNil(mtimeMs) || mtimeMs >= activeAt) {
            return []
        }
        return [{ dirPath: flowVersionPath, mtimeMs, emptyShell: true }]
    }
    const stepDirs = stepEntries.filter((entry) => entry.isDirectory())
    const candidates: PressureCandidate[] = []
    for (const batch of chunk(stepDirs, SCAN_BATCH_SIZE)) {
        const stats = await Promise.all(batch.map(async (entry): Promise<PressureCandidate | null> => {
            const dirPath = path.join(flowVersionPath, entry.name)
            const mtimeMs = await readMtimeMs(dirPath)
            return isNil(mtimeMs) ? null : { dirPath, mtimeMs, emptyShell: false }
        }))
        candidates.push(...stats.filter((entry): entry is PressureCandidate => entry !== null && entry.mtimeMs < activeAt))
    }
    return candidates
}

async function removeExpired({ dirPaths, expiredAt, locks }: RemoveExpiredParams): Promise<ExpiredResult> {
    const survivors: DirEntry[] = []
    const expiredEntries: DirEntry[] = []
    let unreadableCount = 0
    for (const dirPath of dirPaths) {
        const mtimeMs = await readMtimeMs(dirPath)
        if (isNil(mtimeMs)) {
            unreadableCount += 1
            continue
        }
        if (mtimeMs >= expiredAt) {
            survivors.push({ dirPath, mtimeMs })
            continue
        }
        expiredEntries.push({ dirPath, mtimeMs })
    }
    const removed = await removeAll({ entries: expiredEntries, locks })
    return {
        survivors,
        expiredCount: removed.removedCount,
        failedCount: removed.failedCount,
        skippedCount: removed.skippedCount,
        unreadableCount,
    }
}

async function removeAll({ entries, locks }: RemoveAllParams): Promise<RemovalTally> {
    let removedCount = 0
    let failedCount = 0
    let skippedCount = 0
    for (const entry of entries) {
        const outcome = await removeDir({ locks, dirPath: entry.dirPath, expectedMtimeMs: entry.mtimeMs })
        removedCount += outcome === 'removed' ? 1 : 0
        failedCount += outcome === 'failed' ? 1 : 0
        skippedCount += outcome === 'skipped' ? 1 : 0
    }
    return { removedCount, failedCount, skippedCount }
}

async function readMtimeMs(dirPath: string): Promise<number | null> {
    const { data: stats, error } = await tryCatch(() => stat(dirPath))
    if (error) {
        return null
    }
    return stats.mtimeMs
}

async function removeDir({ locks, dirPath, expectedMtimeMs, emptyOnly = false }: RemoveDirParams): Promise<RemoveOutcome> {
    const { data: outcome, error } = await tryCatch(() => locks.runExclusive({
        key: dirPath,
        timeoutMs: EVICTION_TRY_LOCK_TIMEOUT_MS,
        fn: async (): Promise<RemoveOutcome> => {
            const currentMtimeMs = await readMtimeMs(dirPath)
            if (isNil(currentMtimeMs) || currentMtimeMs !== expectedMtimeMs) {
                return 'skipped'
            }
            if (emptyOnly) {
                return removeEmptyDir(dirPath)
            }
            const { error: removeError } = await tryCatch(() => rm(dirPath, { recursive: true, force: true }))
            return isNil(removeError) ? 'removed' : 'failed'
        },
    }))
    if (error) {
        return error instanceof DiskLockTimeoutError ? 'skipped' : 'failed'
    }
    return outcome
}

async function removeEmptyDir(dirPath: string): Promise<RemoveOutcome> {
    const { error } = await tryCatch(() => rmdir(dirPath))
    if (isNil(error)) {
        return 'removed'
    }
    const gainedContentWhileRemoving = 'code' in error && (error.code === 'ENOTEMPTY' || error.code === 'EEXIST')
    return gainedContentWhileRemoving ? 'skipped' : 'failed'
}

const ACTION_RUN_CACHE_TTL_MS = 2 * 60 * 60 * 1000
const ACTION_RUN_PRESSURE_FLOOR_MS = 60 * 60 * 1000
const CODE_CACHE_LOCKS_DIR = 'code-cache-locks'
const PROVISION_LOCK_TIMEOUT_MS = 15 * 60 * 1000
const EVICTION_TRY_LOCK_TIMEOUT_MS = 0
const SCAN_BATCH_SIZE = 16
const USAGE_RECHECK_EVERY = 10
const DISK_PRESSURE_SWEEP_LOCK_KEY = 'disk-pressure-sweep'
const EVICTION_PAUSE_MS = 1000

export const ACTION_RUN_CACHE_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000
export const ACTION_RUN_CACHE_MAX_DIRS = 200
export const CODE_CACHE_SWEEP_INTERVAL_MS = 30 * 60 * 1000
export const CODE_CACHE_FIRST_SWEEP_DELAY_MS = 60 * 1000
export const DISK_EVICTION_THRESHOLD_PERCENT = 90

type CacheLocks = ReturnType<typeof diskLock>

type NamespaceParams = {
    platformId: string
    sourceHash: string
}

type SweepParams = {
    basePath: string
    log: ApLogger
    activeWindowMs?: number
    getUsedPercent?: () => Promise<number>
    pauseMs?: number
}

type WithDirLockParams<T> = {
    basePath: string
    dirPath: string
    fn: () => Promise<T>
}

type ActionRunSweepParams = {
    basePath: string
    log: ApLogger
    activeWindowMs: number
    locks: CacheLocks
}

type DiskPressureSweepParams = {
    basePath: string
    log: ApLogger
    activeWindowMs: number
    getUsedPercent: () => Promise<number>
    locks: CacheLocks
    pauseMs: number
}

type RunDiskPressureEvictionParams = DiskPressureSweepParams & {
    usedPercentBefore: number
}

type DefaultGetUsedPercentParams = {
    basePath: string
    log: ApLogger
}

type DirEntry = {
    dirPath: string
    mtimeMs: number
}

type PressureCandidate = DirEntry & {
    emptyShell: boolean
}

type RemoveDirParams = {
    locks: CacheLocks
    dirPath: string
    expectedMtimeMs: number
    emptyOnly?: boolean
}

type RemoveOutcome = 'removed' | 'skipped' | 'failed'

type ReadActionRunCandidatesParams = {
    basePath: string
    activeAt: number
}

type ReadStepCandidatesParams = {
    flowVersionPath: string
    activeAt: number
}

type RemoveExpiredParams = {
    dirPaths: string[]
    expiredAt: number
    locks: CacheLocks
}

type RemoveAllParams = {
    entries: DirEntry[]
    locks: CacheLocks
}

type ExpiredResult = {
    survivors: DirEntry[]
    expiredCount: number
    failedCount: number
    skippedCount: number
    unreadableCount: number
}

type RemovalTally = {
    removedCount: number
    failedCount: number
    skippedCount: number
}
