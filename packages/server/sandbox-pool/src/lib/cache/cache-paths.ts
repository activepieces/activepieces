import { readdir, rm } from 'fs/promises'
import path from 'path'
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
})

export const LATEST_CACHE_VERSION = 'v12'

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}
