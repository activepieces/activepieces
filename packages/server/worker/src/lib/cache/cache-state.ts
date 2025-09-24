import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { fileSystemUtils, memoryLock } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'
import { file } from 'zod/v4'

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

export const cacheState = (folderPath: string) => {
    return {
        async cacheCheckState(cacheAlias: string): Promise<string | undefined> {
            return fileSystemUtils.runExclusive(folderPath, cacheAlias, async () => {
                const cache = await getCache(folderPath)
                return cache[cacheAlias]
            })
        },
        async setCache(cacheAlias: string, state: string): Promise<void> {
            return fileSystemUtils.runExclusive(folderPath, cacheAlias, async () => {
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