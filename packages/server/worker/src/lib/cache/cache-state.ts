import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { fileSystemUtils } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'

type CacheMap = Record<string, string>

const cachePath = (folderPath: string): string => join(folderPath, 'cache.json')

const cached: Record<string, CacheMap | null> = {}
const getCache = async (folderPath: string): Promise<CacheMap> => {
    if (isNil(cached[folderPath])) {
        const filePath = cachePath(folderPath)
        const cacheExists = await fileSystemUtils.fileExists(filePath)
        if (!cacheExists) {
            await saveToCache({}, folderPath)
        }
        cached[folderPath] = await readCache(folderPath)
    }
    const cache = (cached[folderPath] as CacheMap) || {}
    return cache
}

type CacheResult = {
    cacheHit: boolean
    state: string | null
}

export const ALWAYS_CACHE_MISS = (_: string): boolean => true
export const NO_SAVE_GUARD = (_: string): boolean => false
export const NO_INSTALL_FN = (): Promise<void> => Promise.resolve()

export const cacheState = (folderPath: string): {
    getOrSetCache: (cacheAlias: string, state: (() => Promise<string>) | string, cacheMiss: (key: string) => boolean, installFn: () => Promise<void>, saveGuard: (key: string) => boolean) => Promise<CacheResult>
} => {
    return {
        async getOrSetCache(
            cacheAlias: string,
            state: ( () => Promise<string>) | string,
            cacheMiss: (key: string) => boolean = ALWAYS_CACHE_MISS,
            installFn: () => Promise<void> = NO_INSTALL_FN,
            saveGuard: (key: string) => boolean = NO_SAVE_GUARD,
            
        ): Promise<CacheResult> {
            const cache = await getCache(folderPath)
            const key = cache[cacheAlias]
            if (key === undefined && !cacheMiss(cacheAlias)) {
                return {
                    cacheHit: true,
                    state: key,
                }
            }
            if (saveGuard(key)) {
                return {
                    cacheHit: false,
                    state: null,
                }
            }
            const lockKey = `${folderPath}-${cacheAlias}`
            return fileSystemUtils.runExclusive(folderPath, lockKey, async () => {
                const freshKey = cache[cacheAlias]
                if (key === undefined && !cacheMiss(cacheAlias)) {
                    return { cacheHit: true, state: freshKey }
                }            
                await installFn()
                if (typeof state === 'string') {
                    cache[cacheAlias] = state
                }
                else {
                    cache[cacheAlias] = await state()
                }
                await saveToCache(cache, folderPath)
                return {
                    cacheHit: false,
                    state: cache[cacheAlias],
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