import { readdir, rm } from 'fs/promises'
import path from 'path'
import { logger } from '../../config/logger'

export function cacheRootPaths(cacheRoot: string): CacheRootPaths {
    const latestVersion = path.resolve(cacheRoot, LATEST_CACHE_VERSION)
    return {
        latestVersion,
        common: path.resolve(latestVersion, 'common'),
        codes: path.resolve(latestVersion, 'codes'),
        pieces: path.resolve(latestVersion, 'pieces-metadata'),
        flows: path.resolve(latestVersion, 'flows'),
        enginePath: path.join(latestVersion, 'common', 'main.js'),
    }
}

export function getGlobalCachePathLatestVersion(): string {
    return cacheRootPaths(GLOBAL_CACHE_ROOT).latestVersion
}

export function getGlobalCacheCommonPath(): string {
    return cacheRootPaths(GLOBAL_CACHE_ROOT).common
}

export function getGlobalCodeCachePath(): string {
    return cacheRootPaths(GLOBAL_CACHE_ROOT).codes
}

export function getGlobalCachePiecesPath(): string {
    return cacheRootPaths(GLOBAL_CACHE_ROOT).pieces
}

export function getGlobalCacheFlowsPath(): string {
    return cacheRootPaths(GLOBAL_CACHE_ROOT).flows
}

export function getEnginePath(): string {
    return cacheRootPaths(GLOBAL_CACHE_ROOT).enginePath
}

export async function deleteStaleCache(): Promise<void> {
    try {
        const entries = await readdir(GLOBAL_CACHE_ROOT, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION) {
                await rm(path.join(GLOBAL_CACHE_ROOT, entry.name), { recursive: true })
            }
        }
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to delete stale cache')
    }
}

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}

export const LATEST_CACHE_VERSION = 'v12'

export const GLOBAL_CACHE_ROOT = path.resolve('cache')

export type CacheRootPaths = {
    latestVersion: string
    common: string
    codes: string
    pieces: string
    flows: string
    enginePath: string
}
