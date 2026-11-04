import { readdir, statfs } from 'node:fs/promises'
import path from 'node:path'
import { tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ACTION_RUN_CACHE_ACTIVE_WINDOW_MS } from '../../action-run-cache'
import { cacheEviction } from '../../cache-eviction'
import { ACTION_RUN_CODE_DIR, cacheUtils } from '../../cache-paths'

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
        const flowVersionPaths = await cacheEviction.listManagedDirs({
            parentPath: codesPath,
            log,
            cacheLabel: 'code',
            filterName: (name) => name !== ACTION_RUN_CODE_DIR,
        })
        if (flowVersionPaths === null) {
            return
        }

        const activeAt = Date.now() - activeWindowMs
        const nested = await Promise.all(flowVersionPaths.map((flowVersionPath) => readStepCandidates({ flowVersionPath, activeAt })))
        const candidates = nested.flat()
        candidates.sort((a, b) => a.mtimeMs - b.mtimeMs)

        let evictedCount = 0
        let failedCount = 0
        for (const candidate of candidates) {
            const usedPercent = await getUsedPercent()
            if (usedPercent < maxUsedPercent) {
                break
            }
            const outcome = await cacheEviction.removeDir({ dirPath: candidate.dirPath, expectedMtimeMs: candidate.mtimeMs })
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

async function readStepCandidates({ flowVersionPath, activeAt }: ReadStepCandidatesParams): Promise<DirEntry[]> {
    const { data: stepEntries, error } = await tryCatch(() => readdir(flowVersionPath, { withFileTypes: true }))
    if (error) {
        return []
    }
    const stats = await Promise.all(stepEntries.filter((entry) => entry.isDirectory()).map(async (entry): Promise<DirEntry | null> => {
        const dirPath = path.join(flowVersionPath, entry.name)
        const mtimeMs = await cacheEviction.readMtimeMs(dirPath)
        return mtimeMs === null ? null : { dirPath, mtimeMs }
    }))
    return stats.filter((entry): entry is DirEntry => entry !== null && entry.mtimeMs < activeAt)
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

type ReadStepCandidatesParams = {
    flowVersionPath: string
    activeAt: number
}
