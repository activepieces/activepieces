import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'path'
import { fileExists, threadSafeMkdir } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'

export enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}
type CacheMap = Record<string, CacheState>

const cachePath = (folderPath: string): string => join(folderPath, 'cache.json')

const cached: Record<string, CacheMap | null> = {}
const getCache = async (folderPath: string): Promise<CacheMap> => {
    if (isNil(cached[folderPath])) {
        const filePath = cachePath(folderPath)
        const cacheExists = await fileExists(filePath)
        if (!cacheExists) {
            await saveToCache({}, folderPath)
        }
        cached[folderPath] = await readCache(folderPath)
    }
    const cache = cached[folderPath] || {}
    return cache
}

export const cacheHandler = (folderPath: string) => {
    return {
        async cacheCheckState(cacheAlias: string): Promise<CacheState | undefined> {
            const cache = await getCache(folderPath)
            return cache[cacheAlias]
        },
        async setCache(cacheAlias: string, state: CacheState): Promise<void> {
            const cache = await getCache(folderPath)
            cache[cacheAlias] = state
            await saveToCache(cache, folderPath)
        },
    }
}

async function saveToCache(cache: CacheMap, folderPath: string): Promise<void> {
    await threadSafeMkdir(folderPath)
    const filePath = cachePath(folderPath)
    await writeFile(filePath, JSON.stringify(cache), 'utf8')
}

async function readCache(folderPath: string): Promise<CacheMap> {
    const filePath = cachePath(folderPath)
    const fileContent = await readFile(filePath, 'utf8')
    return JSON.parse(fileContent)
}