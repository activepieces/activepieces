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
    state: string
}
export const cacheState = (folderPath: string) => {
    return {
        async cache(
            cacheAlias: string,
            state: string,
            cacheMiss: (key: string) => boolean,
            installFn?: () => Promise<void>,
        ): Promise<CacheResult> {
            const cache = await getCache(folderPath)
            const key = cache[cacheAlias]
            const validCacheHit = key !== undefined && !cacheMiss(key)
            if (validCacheHit) {
                return {
                    cacheHit: true,
                    state: key,
                }
            }
            const lockKey = `${folderPath}-${cacheAlias}`
            return fileSystemUtils.runExclusive(folderPath, lockKey, async () => {
                const freshKey = cache[cacheAlias]
                if (freshKey !== undefined && !cacheMiss(freshKey)) {
                    return { cacheHit: true, state: freshKey }
                }            
                await installFn?.()
                cache[cacheAlias] = state
                await saveToCache(cache, folderPath)
                return {
                    cacheHit: false,
                    state: state,
                }
            })
        },
        async cacheCheckState(cacheAlias: string): Promise<string | undefined> {
            const cache = await getCache(folderPath)
            return cache[cacheAlias]
        },
        async setCache(cacheAlias: string, state: string): Promise<void> {
            const lockKey = `${folderPath}-${cacheAlias}`
            return fileSystemUtils.runExclusive(folderPath, lockKey, async () => {
                const cache = await getCache(folderPath)
                cache[cacheAlias] = state
                await saveToCache(cache, folderPath)
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