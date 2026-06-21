import { readdir, rm } from 'fs/promises'
import path from 'path'
import { logger } from '../config/logger'

// The cache root is injectable so different runtimes can point the on-disk piece/code/engine
// cache at a writable location of their choosing (e.g. a host-mounted persistent dir for the
// worker-pool runtime, or an ephemeral dir for serverless). Defaults to `<cwd>/cache`, which
// preserves the original behavior for every existing caller.
let cacheRootPath = path.resolve('cache')

export function configureCacheRootPath(rootPath: string): void {
    cacheRootPath = path.resolve(rootPath)
}

export function getGlobalCachePathLatestVersion(): string {
    return path.resolve(cacheRootPath, LATEST_CACHE_VERSION)
}

export function getGlobalCacheCommonPath(): string {
    return path.resolve(getGlobalCachePathLatestVersion(), 'common')
}

export function getGlobalCodeCachePath(): string {
    return path.resolve(getGlobalCachePathLatestVersion(), 'codes')
}

export function getGlobalCachePiecesPath(): string {
    return path.resolve(getGlobalCachePathLatestVersion(), 'pieces-metadata')
}

export function getGlobalCacheFlowsPath(): string {
    return path.resolve(getGlobalCachePathLatestVersion(), 'flows')
}

export function getEnginePath(): string {
    return path.join(getGlobalCacheCommonPath(), 'main.js')
}

export function getGlobalCacheAllVersionsPath(): string {
    return cacheRootPath
}

export async function deleteStaleCache(): Promise<void> {
    try {
        const cacheDir = getGlobalCacheAllVersionsPath()
        const entries = await readdir(cacheDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION) {
                await rm(path.join(cacheDir, entry.name), { recursive: true })
            }
        }
    }
    catch (error) {
        logger.error({ error }, 'Failed to delete stale cache')
    }
}

export const LATEST_CACHE_VERSION = 'v12'

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}
