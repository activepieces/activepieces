import { readdir, rm, stat, utimes } from 'node:fs/promises'
import path from 'node:path'
import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
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

    async touch(dirPath: string): Promise<void> {
        const now = new Date()
        await tryCatch(() => utimes(dirPath, now, now))
    },

    async settlePendingRemoval(dirPath: string): Promise<boolean> {
        const pending = pendingRemovals.get(dirPath)
        if (isNil(pending)) {
            return false
        }
        await pending
        return true
    },

    async sweep({ basePath, log }: SweepParams): Promise<void> {
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

        const activeAt = Date.now() - ACTION_RUN_CACHE_ACTIVE_WINDOW_MS
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
    },
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

async function removeDir({ dirPath, expectedMtimeMs }: RemoveDirParams): Promise<RemoveOutcome> {
    const currentMtimeMs = await readMtimeMs(dirPath)
    if (isNil(currentMtimeMs) || currentMtimeMs !== expectedMtimeMs) {
        return 'skipped'
    }
    const removal = tryCatch(() => rm(dirPath, { recursive: true, force: true }))
    pendingRemovals.set(dirPath, removal)
    const { error } = await removal
    pendingRemovals.delete(dirPath)
    if (isNil(error)) {
        return 'removed'
    }
    return 'failed'
}

const pendingRemovals = new Map<string, Promise<unknown>>()

const ACTION_RUN_CACHE_TTL_MS = 2 * 60 * 60 * 1000

export const ACTION_RUN_CACHE_ACTIVE_WINDOW_MS = 15 * 60 * 1000
export const ACTION_RUN_CACHE_MAX_DIRS = 200
export const ACTION_RUN_CACHE_SWEEP_INTERVAL_MS = 30 * 60 * 1000
export const ACTION_RUN_CACHE_FIRST_SWEEP_DELAY_MS = 60 * 1000

type NamespaceParams = {
    platformId: string
    sourceHash: string
}

type SweepParams = {
    basePath: string
    log: ApLogger
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
