import { readdir, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'
import { exceptionHandler, fileSystemUtils } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { workerDistributedLock } from '../utils/worker-redis'

export const LATEST_CACHE_VERSION = 'v5'
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

let cacheId: string | undefined

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
    async getCacheId(): Promise<string> {
        if (!isNil(cacheId)) {
            return cacheId
        }
        return workerDistributedLock(log).runExclusive({
            key: 'cache-id',
            timeoutInSeconds: 120,
            fn: async () => {
                const cacheFile = path.join(GLOBAL_CACHE_ALL_VERSIONS_PATH, 'info.json')
                const cacheExists = await fileSystemUtils.fileExists(cacheFile)
                if (!cacheExists) {
                    const cacheInfo: CacheInfo = {
                        id: nanoid(),
                        createdAt: new Date().toISOString(),
                    }
                    await fileSystemUtils.threadSafeMkdir(GLOBAL_CACHE_ALL_VERSIONS_PATH)
                    await writeFile(cacheFile, JSON.stringify(cacheInfo))
                }
                const cache = await readFile(cacheFile, 'utf8')
                const cacheData: CacheInfo = JSON.parse(cache)
                cacheId = cacheData.id
                return cacheId
            },
        })
    },
})

type CacheInfo = {
    id: string
    createdAt: string
}

