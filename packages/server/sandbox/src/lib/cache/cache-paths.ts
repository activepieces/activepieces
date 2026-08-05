import { readdir, rm } from 'fs/promises'
import path from 'path'
import { type ApLogger } from '@activepieces/server-utils'
import { RUN_STATE_STORE_DIR_PREFIX } from '@activepieces/shared'

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

    async deleteStaleCache(log: ApLogger): Promise<void> {
        try {
            const cacheDir = path.resolve(basePath)
            const entries = await readdir(cacheDir, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION) {
                    await rm(path.join(cacheDir, entry.name), { recursive: true })
                }
            }
        }
        catch (error) {
            log.error({ error }, 'Failed to delete stale cache')
        }
    },

    async deleteStaleRunStateDirs(log: ApLogger): Promise<void> {
        try {
            const flowsDir = this.getGlobalCacheFlowsPath()
            const cutoffDate = new Date(Date.now() - RUN_STATE_RETENTION_MS).toISOString().slice(0, 10)
            const entries = await readdir(flowsDir, { withFileTypes: true })

            for (const entry of entries) {
                if (!entry.isDirectory() || !entry.name.startsWith(RUN_STATE_STORE_DIR_PREFIX)) {
                    continue
                }
                if (entry.name.slice(RUN_STATE_STORE_DIR_PREFIX.length) <= cutoffDate) {
                    await rm(path.join(flowsDir, entry.name), { recursive: true, force: true })
                    log.info({ dir: entry.name }, 'Deleted stale run state dir')
                }
            }
        }
        catch (error) {
            const isMissingDir = error instanceof Error && 'code' in error && error.code === 'ENOENT'
            if (!isMissingDir) {
                log.error({ error }, 'Failed to delete stale run state dirs')
            }
        }
    },
})

const RUN_STATE_RETENTION_MS = 2 * 24 * 60 * 60 * 1000

export const LATEST_CACHE_VERSION = 'v12'

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}
