import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { fileSystemUtils, memoryLock } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'

type CacheMap = Record<string, string>

const cachePath = (folderPath: string): string => join(folderPath, 'cache.json')
type GetCacheParams = {
    folderPath: string
    forceReload: boolean
}
const cached: Record<string, CacheMap | null> = {}
const getCache = async ({ folderPath, forceReload }: GetCacheParams): Promise<CacheMap> => {
    if (!isNil(cached[folderPath]) && !forceReload) {
        return cached[folderPath]
    }
    return memoryLock.runExclusive(`cache-read-${folderPath}`, async () => {
        if (!isNil(cached[folderPath]) && !forceReload) {
            return cached[folderPath]
        }
        const filePath = cachePath(folderPath)
        const cacheExists = await fileSystemUtils.fileExists(filePath)
        if (!cacheExists) {
            cached[folderPath] = {}
            return cached[folderPath]
        }
        cached[folderPath] = await readCache(folderPath)
        return cached[folderPath] as CacheMap
    })
}

type CacheResult = {
    cacheHit: boolean
    state: string | null
}

type CacheStateParams = {
    cacheAlias: string
    state: (() => Promise<string>) | string
    cacheMiss: (key: string) => boolean
    installFn: () => Promise<void>
    saveGuard: (key: string) => boolean
}

export const ALWAYS_CACHE_MISS = (_: string): boolean => true
export const NO_SAVE_GUARD = (_: string): boolean => false
export const NO_INSTALL_FN = (): Promise<void> => Promise.resolve()

export const cacheState = (folderPath: string): {
    getOrSetCache: (cacheStateParams: CacheStateParams) => Promise<CacheResult>
} => {
    return {
        async getOrSetCache({ cacheAlias, state, cacheMiss, installFn, saveGuard }: CacheStateParams): Promise<CacheResult> {
            let cache = await getCache({ folderPath, forceReload: false })
            const key = cache[cacheAlias]
            if (!isNil(key) && !cacheMiss(key)) {
                return {
                    cacheHit: true,
                    state: key,
                }
            }
            const lockKey = `${folderPath}-${cacheAlias}`
            return fileSystemUtils.runExclusive(folderPath, lockKey, async () => {
                cache = await getCache({ folderPath, forceReload: true })
                const freshKey = cache[cacheAlias]
                if (!isNil(freshKey) && !cacheMiss(freshKey)) {
                    return { cacheHit: true, state: freshKey }
                }            
                const stateValue = typeof state === 'string' ? state : await state()
                if (saveGuard(stateValue)) {
                    return {
                        cacheHit: false,
                        state: null,
                    }
                }  
                await installFn()
                cache[cacheAlias] = stateValue
                await saveToCache(cache, folderPath)
                cached[folderPath] = cache
                return {
                    cacheHit: false,
                    state: stateValue,
                }
            })
        },
    }
}


async function saveToCache(cache: CacheMap, folderPath: string): Promise<void> {
    await fileSystemUtils.threadSafeMkdir(folderPath)
    const filePath = cachePath(folderPath)
    await writeFileAtomic(filePath, JSON.stringify(cache), 'utf8')
}

async function readCache(folderPath: string): Promise<CacheMap> {
    const filePath = cachePath(folderPath)
    const fileContent = await readFile(filePath, 'utf8')
    return JSON.parse(fileContent)
}