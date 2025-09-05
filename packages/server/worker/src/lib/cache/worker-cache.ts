import { readdir, rm } from 'fs/promises'
import path from 'path'
import { exceptionHandler } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'

export const LATEST_CACHE_VERSION = 'v3'
export const GLOBAL_CACHE_ALL_VERSIONS_PATH = path.resolve('cache')
export const GLOBAL_CACHE_PATH_LATEST_VERSION = path.resolve('cache', LATEST_CACHE_VERSION)
export const GLOBAL_CACHE_COMMON_PATH = path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'common')
export const GLOBAL_CODE_CACHE_PATH = path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'codes')
export const ENGINE_PATH = path.join(GLOBAL_CACHE_COMMON_PATH, 'main.js')
export const GLOBAL_CACHE_PIECES_PATH = path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'pieces')
export const GLOBAL_CACHE_FLOWS_PATH = path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'flows')
export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}


export const workerCache = (log: FastifyBaseLogger) => ({
    async deleteStaleCache(): Promise<void> {
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
            exceptionHandler.handle(error, log)
        }
    },
})

