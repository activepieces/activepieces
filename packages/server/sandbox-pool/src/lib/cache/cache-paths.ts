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

    getEnginePath(): string {
        return path.join(this.getGlobalCacheCommonPath(), 'main.js')
    },

    getEngineCompileCachePath(): string {
        return path.join(this.getGlobalCacheCommonPath(), ENGINE_COMPILE_CACHE_DIRNAME)
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

// Subdir under the engine's common cache holding V8 bytecode for the engine bundle. Prewarmed
// at Docker build time (tools/prewarm-engine-compile-cache.mjs) and consumed at runtime via
// NODE_COMPILE_CACHE so cold-boot forks skip re-parsing main.js. Keep this name in sync with
// the build-time prewarm script and the isolate in-sandbox path in isolate.ts.
export const ENGINE_COMPILE_CACHE_DIRNAME = 'v8-compile-cache'

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}
