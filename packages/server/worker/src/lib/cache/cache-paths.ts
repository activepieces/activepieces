import { readdir, rm } from 'fs/promises'
import path from 'path'
import { logger } from '../config/logger'

export const LATEST_CACHE_VERSION = 'v11'

export const GLOBAL_CACHE_ALL_VERSIONS_PATH = path.resolve('cache')

export function getGlobalCachePathLatestVersion(): string {
    return path.resolve('cache', LATEST_CACHE_VERSION)
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

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}

export async function deleteStaleCache(): Promise<void> {
    try {
        const cacheDir = path.resolve(GLOBAL_CACHE_ALL_VERSIONS_PATH)
        const entries = await readdir(cacheDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION) {
                await rm(path.join(cacheDir, entry.name), { recursive: true })
            }
        }
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to delete stale cache')
    }
}
