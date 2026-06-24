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

    // Wipe everything under the cache version EXCEPT the engine bundle (main.js + its map + the engine
    // marker in common/cache.json). Used by AP_SANDBOX_CLEAN_CACHE so each run re-installs pieces/code
    // cold while the static, version-pinned engine stays put (its install is a no-op cache hit).
    async cleanExceptEngine(): Promise<void> {
        const versionDir = this.getGlobalCachePathLatestVersion()
        const commonDir = this.getGlobalCacheCommonPath()
        const engineKeep = new Set(['main.js', 'main.js.map', 'cache.json'])

        const versionEntries = await readdir(versionDir, { withFileTypes: true }).catch(() => [])
        await Promise.all(versionEntries
            .filter((entry) => entry.name !== 'common')
            .map((entry) => rm(path.join(versionDir, entry.name), { recursive: true, force: true })))

        const commonEntries = await readdir(commonDir, { withFileTypes: true }).catch(() => [])
        await Promise.all(commonEntries
            .filter((entry) => !engineKeep.has(entry.name))
            .map((entry) => rm(path.join(commonDir, entry.name), { recursive: true, force: true })))
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
