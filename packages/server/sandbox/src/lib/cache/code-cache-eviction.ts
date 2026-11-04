import { readdir, rm, stat, statfs, utimes } from 'node:fs/promises'
import path from 'node:path'
import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ACTION_RUN_CODE_DIR, cacheUtils } from './cache-paths'
import { pendingCacheRemovals } from './pending-cache-removals'

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

    async touch(dirPath: string): Promise<void> {
        const now = new Date()
        await tryCatch(() => utimes(dirPath, now, now))
    },

    async settlePendingRemoval(dirPath: string): Promise<boolean> {
        return pendingCacheRemovals.settle(dirPath)
    },
}

export const codeCacheEviction = {
    // The code cache holds two kinds of entries with different lifecycles, swept in two passes
    // sharing the same mechanics (mtime-ordered candidates, re-stat before a tracked removal):
    // - action-runs/: per-source build dirs with no natural end of life, so they always get a
    //   TTL + count-cap sweep.
    // - every other dir is a published flow version's code cache, kept forever by the normal
    //   provisioning path, so it is only evicted under disk pressure. Candidates are individual
    //   step dirs (code-builder.ts touches one on every use, hit or miss), not whole flow
    //   versions, so a flow with one hot step and nine cold ones only loses the nine.
    async sweep({
        basePath,
        log,
        activeWindowMs = ACTION_RUN_CACHE_ACTIVE_WINDOW_MS,
        maxUsedPercent = DISK_EVICTION_THRESHOLD_PERCENT,
        getUsedPercent = () => defaultGetUsedPercent(basePath),
    }: SweepParams): Promise<void> {
        await sweepActionRuns({ basePath, log, activeWindowMs })
        await sweepOnDiskPressure({ basePath, log, activeWindowMs, maxUsedPercent, getUsedPercent })
    },
}

async function sweepActionRuns({ basePath, log, activeWindowMs }: ActionRunSweepParams): Promise<void> {
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

    const expired = await removeExpired({ dirPaths: managed, expiredAt: Date.now() - ACTION_RUN_CACHE_TTL_MS })

    const activeAt = Date.now() - activeWindowMs
    const evictable = expired.survivors.filter((entry) => entry.mtimeMs < activeAt)
    const overBy = expired.survivors.length - ACTION_RUN_CACHE_MAX_DIRS
    const evicted = await removeOldest(overBy > 0
        ? [...evictable].sort((a, b) => a.mtimeMs - b.mtimeMs).slice(0, overBy)
        : [])

    const failedCount = expired.failedCount + evicted.failedCount
    const retainedCount = managed.length - expired.expiredCount - evicted.removedCount - expired.unreadableCount
    const summary = {
        expiredCount: expired.expiredCount,
        evictedCount: evicted.removedCount,
        retainedCount,
        activeCount: expired.survivors.length - evictable.length,
        failedCount,
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

async function sweepOnDiskPressure({ basePath, log, activeWindowMs, maxUsedPercent, getUsedPercent }: DiskPressureSweepParams): Promise<void> {
    const usedPercentBefore = await getUsedPercent()
    if (usedPercentBefore < maxUsedPercent) {
        return
    }

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
    const nested = await Promise.all(flowVersionDirs.map((entry) => readStepCandidates({
        flowVersionPath: path.join(codesPath, entry.name),
        activeAt,
    })))
    const candidates = nested.flat()
    candidates.sort((a, b) => a.mtimeMs - b.mtimeMs)

    let evictedCount = 0
    let failedCount = 0
    for (const candidate of candidates) {
        const usedPercent = await getUsedPercent()
        if (usedPercent < maxUsedPercent) {
            break
        }
        const outcome = await removeDir({ dirPath: candidate.dirPath, expectedMtimeMs: candidate.mtimeMs })
        evictedCount += outcome === 'removed' ? 1 : 0
        failedCount += outcome === 'failed' ? 1 : 0
    }

    const usedPercentAfter = await getUsedPercent()
    const summary = {
        evictedCount,
        failedCount,
        candidateCount: candidates.length,
        usedPercentBefore,
        usedPercentAfter,
        maxUsedPercent,
    }
    if (failedCount > 0) {
        log.warn(summary, 'Code cache disk-usage eviction could not remove every candidate')
        return
    }
    if (evictedCount > 0) {
        log.info(summary, 'Evicted code cache directories to relieve disk pressure')
        return
    }
    if (usedPercentAfter >= maxUsedPercent) {
        log.warn(summary, 'Disk usage is above threshold but no evictable code cache directories were found')
    }
}

async function defaultGetUsedPercent(basePath: string): Promise<number> {
    const { data: stats, error } = await tryCatch(() => statfs(basePath))
    if (error || stats.blocks === 0) {
        return 0
    }
    return ((stats.blocks - stats.bavail) / stats.blocks) * 100
}

async function readStepCandidates({ flowVersionPath, activeAt }: ReadStepCandidatesParams): Promise<DirEntry[]> {
    const { data: stepEntries, error } = await tryCatch(() => readdir(flowVersionPath, { withFileTypes: true }))
    if (error) {
        return []
    }
    const stats = await Promise.all(stepEntries.filter((entry) => entry.isDirectory()).map(async (entry): Promise<DirEntry | null> => {
        const dirPath = path.join(flowVersionPath, entry.name)
        const mtimeMs = await readMtimeMs(dirPath)
        return isNil(mtimeMs) ? null : { dirPath, mtimeMs }
    }))
    return stats.filter((entry): entry is DirEntry => entry !== null && entry.mtimeMs < activeAt)
}

async function removeExpired({ dirPaths, expiredAt }: RemoveExpiredParams): Promise<ExpiredResult> {
    const survivors: DirEntry[] = []
    let expiredCount = 0
    let failedCount = 0
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
        const outcome = await removeDir({ dirPath, expectedMtimeMs: mtimeMs })
        expiredCount += outcome === 'removed' ? 1 : 0
        failedCount += outcome === 'failed' ? 1 : 0
    }
    return { survivors, expiredCount, failedCount, unreadableCount }
}

async function removeOldest(entries: DirEntry[]): Promise<EvictedResult> {
    let removedCount = 0
    let failedCount = 0
    for (const entry of entries) {
        const outcome = await removeDir({ dirPath: entry.dirPath, expectedMtimeMs: entry.mtimeMs })
        removedCount += outcome === 'removed' ? 1 : 0
        failedCount += outcome === 'failed' ? 1 : 0
    }
    return { removedCount, failedCount }
}

async function readMtimeMs(dirPath: string): Promise<number | null> {
    const { data: stats, error } = await tryCatch(() => stat(dirPath))
    if (error) {
        return null
    }
    return stats.mtimeMs
}

// Re-stats immediately before removing so a directory touched after being listed (a build that
// just reused it) is skipped instead of deleted out from under it. Tracks the removal in
// pendingCacheRemovals so provisioning can wait it out and rebuild instead of racing a cache hit
// against files still being unlinked.
async function removeDir({ dirPath, expectedMtimeMs }: RemoveDirParams): Promise<RemoveOutcome> {
    const currentMtimeMs = await readMtimeMs(dirPath)
    if (isNil(currentMtimeMs) || currentMtimeMs !== expectedMtimeMs) {
        return 'skipped'
    }
    const removal = tryCatch(() => rm(dirPath, { recursive: true, force: true }))
    pendingCacheRemovals.track(dirPath, removal)
    const { error } = await removal
    pendingCacheRemovals.untrack(dirPath)
    if (isNil(error)) {
        return 'removed'
    }
    return 'failed'
}

const ACTION_RUN_CACHE_TTL_MS = 2 * 60 * 60 * 1000

export const ACTION_RUN_CACHE_ACTIVE_WINDOW_MS = 15 * 60 * 1000
export const ACTION_RUN_CACHE_MAX_DIRS = 200
export const CODE_CACHE_SWEEP_INTERVAL_MS = 30 * 60 * 1000
export const CODE_CACHE_FIRST_SWEEP_DELAY_MS = 60 * 1000
export const DISK_EVICTION_THRESHOLD_PERCENT = 80

type NamespaceParams = {
    platformId: string
    sourceHash: string
}

type SweepParams = {
    basePath: string
    log: ApLogger
    activeWindowMs?: number
    maxUsedPercent?: number
    getUsedPercent?: () => Promise<number>
}

type ActionRunSweepParams = {
    basePath: string
    log: ApLogger
    activeWindowMs: number
}

type DiskPressureSweepParams = {
    basePath: string
    log: ApLogger
    activeWindowMs: number
    maxUsedPercent: number
    getUsedPercent: () => Promise<number>
}

type DirEntry = {
    dirPath: string
    mtimeMs: number
}

type RemoveDirParams = {
    dirPath: string
    expectedMtimeMs: number
}

type RemoveOutcome = 'removed' | 'skipped' | 'failed'

type ReadStepCandidatesParams = {
    flowVersionPath: string
    activeAt: number
}

type RemoveExpiredParams = {
    dirPaths: string[]
    expiredAt: number
}

type ExpiredResult = {
    survivors: DirEntry[]
    expiredCount: number
    failedCount: number
    unreadableCount: number
}

type EvictedResult = {
    removedCount: number
    failedCount: number
}
