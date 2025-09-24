import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { fileSystemUtils, memoryLock } from '@activepieces/server-shared'
import writeFileAtomic from 'write-file-atomic'

type CacheMap = Record<string, string>
type Cache = {
    cacheCheckState: (cacheAlias: string) => Promise<string | undefined>
    setCache: (cacheAlias: string, state: string) => Promise<void>
}

const cachePath = (folderPath: string): string => join(folderPath, 'cache.json')

export const cacheState = (folderPath: string): Cache => {
    return {
        async cacheCheckState(cacheAlias: string): Promise<string | undefined> {
            const cache = await readCache(folderPath)
            return cache[cacheAlias]
        },
        async setCache(cacheAlias: string, state: string): Promise<void> {
            return fileSystemUtils.runExclusive(folderPath, cacheAlias, async () => {
                const cache = await readCache(folderPath)
                cache[cacheAlias] = state
                await saveToCache(cache, folderPath)
            })
        },
    }
}


async function saveToCache(cache: CacheMap, folderPath: string): Promise<void> {
    return fileSystemUtils.runExclusive(folderPath, 'saveToCache', async () => {
        await fileSystemUtils.threadSafeMkdir(folderPath)
        const filePath = cachePath(folderPath)
        const fileExists = await fileSystemUtils.fileExists(filePath)
        if (fileExists) {
            return
        }
        await writeFileAtomic(filePath, JSON.stringify(cache), 'utf8')
    })
}

async function readCache(folderPath: string): Promise<CacheMap> {
    const filePath = cachePath(folderPath)
    const cacheExists = await fileSystemUtils.fileExists(filePath)
    if (!cacheExists) {
        return {}
    }
    const fileContent = await readFile(filePath, 'utf8')
    return JSON.parse(fileContent)
}