import { readdir, rm, stat } from 'fs/promises'
import path from 'path'
import { tryCatch } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'

export const cacheUtils = (basePath: string) => ({
    getGlobalCachePathLatestVersion(): string {
        return path.resolve(basePath, LATEST_CACHE_VERSION)
    },

    getGlobalCacheCommonPath(): string {
        return path.resolve(this.getGlobalCachePathLatestVersion(), 'common')
    },

    getGlobalCodeCachePath(): string {
        return path.resolve(this.getGlobalCachePathLatestVersion(), 'codes')
    },

    getActionRunCodeCachePath(): string {
        return path.resolve(this.getGlobalCodeCachePath(), ACTION_RUN_CODE_DIR)
    },

    getGlobalCachePiecesPath(): string {
        return path.resolve(this.getGlobalCachePathLatestVersion(), 'pieces-metadata')
    },

    getGlobalCacheFlowsPath(): string {
        return path.resolve(this.getGlobalCachePathLatestVersion(), 'flows')
    },

    getGlobalCacheBundlesPath(): string {
        return path.resolve(this.getGlobalCachePathLatestVersion(), 'bundles')
    },

    getEnginePath(): string {
        return path.join(this.getGlobalCacheCommonPath(), 'main.js')
    },

    // The cache volume is shared by every worker container on the host and a rolling deploy runs
    // both versions at once, so a previous version's directory is only abandoned once the current
    // one has been in use here long enough for the rollout to be over. Holding the grace period
    // costs disk; breaking it deletes the tree a still-running old worker executes from.
    async deleteStaleCache(log: ApLogger): Promise<void> {
        try {
            const cacheDir = path.resolve(basePath)
            const entries = await readdir(cacheDir, { withFileTypes: true })
            const staleDirectories = entries.filter((entry) => entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION)
            if (staleDirectories.length === 0) {
                return
            }
            const currentVersionInUseForMs = await inUseForMs(path.join(cacheDir, LATEST_CACHE_VERSION))
            if (currentVersionInUseForMs < STALE_CACHE_GRACE_MS) {
                log.info({
                    versions: staleDirectories.map((entry) => entry.name),
                    currentVersionInUseForMs,
                }, 'Keeping stale cache until the rollout grace period passes')
                return
            }
            for (const entry of staleDirectories) {
                await rm(path.join(cacheDir, entry.name), { recursive: true })
            }
            log.info({ versions: staleDirectories.map((entry) => entry.name) }, 'Deleted stale cache')
        }
        catch (error) {
            log.error({ error }, 'Failed to delete stale cache')
        }
    },
})

async function inUseForMs(versionPath: string): Promise<number> {
    const { data: stats, error } = await tryCatch(() => stat(versionPath))
    if (error !== null) {
        return 0
    }
    return Date.now() - stats.mtimeMs
}

export const LATEST_CACHE_VERSION = 'v14'

export const STALE_CACHE_GRACE_MS = 2 * 60 * 60 * 1000

export const ACTION_RUN_CODE_DIR = 'action-runs'

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}
