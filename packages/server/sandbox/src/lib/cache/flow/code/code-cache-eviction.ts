import { Dirent } from 'node:fs'
import { readdir, rm, stat, statfs } from 'node:fs/promises'
import path from 'node:path'
import { tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ACTION_RUN_CACHE_ACTIVE_WINDOW_MS } from '../../action-run-cache'
import { ACTION_RUN_CODE_DIR, cacheUtils } from '../../cache-paths'
import { pendingCacheRemovals } from '../../pending-cache-removals'

export const codeCacheEviction = {
    // Only the action-runs namespace gets a dedicated TTL/count sweep (action-run-cache.ts).
    // Every other entry here is a published flow version's code cache, kept forever by the normal
    // provisioning path, so it needs its own eviction once disk pressure shows up. Candidates are
    // individual step dirs (code-builder.ts touches one on every use, hit or miss), not whole flow
    // versions, so a flow with one hot step and nine cold ones only loses the nine.
    async sweep({
        basePath,
        log,
        maxUsedPercent = DISK_EVICTION_THRESHOLD_PERCENT,
        activeWindowMs = ACTION_RUN_CACHE_ACTIVE_WINDOW_MS,
        getUsedPercent = () => defaultGetUsedPercent(basePath),
    }: SweepParams): Promise<void> {
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
        const candidates = await readEvictionCandidates({ codesPath, entries, activeAt })
        candidates.sort((a, b) => a.mtimeMs - b.mtimeMs)

        let evictedCount = 0
        let failedCount = 0
        for (const candidate of candidates) {
            const usedPercent = await getUsedPercent()
            if (usedPercent < maxUsedPercent) {
                break
            }
            const outcome = await removeDir(candidate)
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
    },
}

async function defaultGetUsedPercent(basePath: string): Promise<number> {
    const { data: stats, error } = await tryCatch(() => statfs(basePath))
    if (error || stats.blocks === 0) {
        return 0
    }
    return ((stats.blocks - stats.bavail) / stats.blocks) * 100
}

async function readEvictionCandidates({ codesPath, entries, activeAt }: ReadCandidatesParams): Promise<DirEntry[]> {
    const flowVersionDirs = entries.filter((entry) => entry.isDirectory() && entry.name !== ACTION_RUN_CODE_DIR)
    const nested = await Promise.all(flowVersionDirs.map((entry) => readStepCandidates({
        flowVersionPath: path.join(codesPath, entry.name),
        activeAt,
    })))
    return nested.flat()
}

async function readStepCandidates({ flowVersionPath, activeAt }: ReadStepCandidatesParams): Promise<DirEntry[]> {
    const { data: stepEntries, error } = await tryCatch(() => readdir(flowVersionPath, { withFileTypes: true }))
    if (error) {
        return []
    }
    const stats = await Promise.all(stepEntries.filter((entry) => entry.isDirectory()).map(async (entry): Promise<DirEntry | null> => {
        const dirPath = path.join(flowVersionPath, entry.name)
        const { data: dirStat, error: statError } = await tryCatch(() => stat(dirPath))
        if (statError) {
            return null
        }
        return { dirPath, mtimeMs: dirStat.mtimeMs }
    }))
    return stats.filter((entry): entry is DirEntry => entry !== null && entry.mtimeMs < activeAt)
}

async function removeDir({ dirPath, mtimeMs }: DirEntry): Promise<'removed' | 'skipped' | 'failed'> {
    const { data: currentStat, error: statError } = await tryCatch(() => stat(dirPath))
    if (statError || currentStat.mtimeMs !== mtimeMs) {
        return 'skipped'
    }
    const removal = tryCatch(() => rm(dirPath, { recursive: true, force: true }))
    pendingCacheRemovals.track(dirPath, removal)
    const { error } = await removal
    pendingCacheRemovals.untrack(dirPath)
    return error ? 'failed' : 'removed'
}

export const DISK_EVICTION_THRESHOLD_PERCENT = 80

type SweepParams = {
    basePath: string
    log: ApLogger
    maxUsedPercent?: number
    activeWindowMs?: number
    getUsedPercent?: () => Promise<number>
}

type DirEntry = {
    dirPath: string
    mtimeMs: number
}

type ReadCandidatesParams = {
    codesPath: string
    entries: Dirent[]
    activeAt: number
}

type ReadStepCandidatesParams = {
    flowVersionPath: string
    activeAt: number
}
