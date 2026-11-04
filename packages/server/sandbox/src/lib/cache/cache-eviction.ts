import { readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { pendingCacheRemovals } from './pending-cache-removals'

// Shared by every cache-sweep policy (action-run-cache.ts: TTL + count cap, code-cache-eviction.ts:
// disk-usage threshold) so the actual filesystem mechanics — listing a parent directory's
// candidates, reading a directory's mtime safely, and removing it without racing a concurrent
// build — only need to be gotten right once.
export const cacheEviction = {
    async listManagedDirs({ parentPath, log, cacheLabel, filterName = () => true }: ListManagedDirsParams): Promise<string[] | null> {
        const { data: entries, error } = await tryCatch(() => readdir(parentPath, { withFileTypes: true }))
        if (error) {
            if ('code' in error && error.code === 'ENOENT') {
                log.debug({ cache: { path: parentPath } }, `${cacheLabel} cache directory does not exist yet`)
                return null
            }
            log.warn({ error, cache: { path: parentPath } }, `Failed to read the ${cacheLabel} cache directory`)
            return null
        }
        return entries
            .filter((entry) => entry.isDirectory() && filterName(entry.name))
            .map((entry) => path.join(parentPath, entry.name))
    },

    async readMtimeMs(dirPath: string): Promise<number | null> {
        const { data: stats, error } = await tryCatch(() => stat(dirPath))
        if (error) {
            return null
        }
        return stats.mtimeMs
    },

    // Re-stats immediately before removing so a directory touched after being listed (a build that
    // just reused it) is skipped instead of deleted out from under it. Tracks the removal in
    // pendingCacheRemovals so provisioning can wait it out and rebuild instead of racing a cache hit
    // against files still being unlinked.
    async removeDir({ dirPath, expectedMtimeMs }: RemoveDirParams): Promise<CacheEvictionOutcome> {
        const currentMtimeMs = await cacheEviction.readMtimeMs(dirPath)
        if (isNil(currentMtimeMs) || currentMtimeMs !== expectedMtimeMs) {
            return 'skipped'
        }
        const removal = tryCatch(() => rm(dirPath, { recursive: true, force: true }))
        pendingCacheRemovals.track(dirPath, removal)
        const { error } = await removal
        pendingCacheRemovals.untrack(dirPath)
        return isNil(error) ? 'removed' : 'failed'
    },
}

export type CacheEvictionOutcome = 'removed' | 'skipped' | 'failed'

type ListManagedDirsParams = {
    parentPath: string
    log: ApLogger
    cacheLabel: string
    filterName?: (name: string) => boolean
}

type RemoveDirParams = {
    dirPath: string
    expectedMtimeMs: number
}
