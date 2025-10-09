import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { fileSystemUtils } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { ScalableBloomFilter } from 'bloom-filters'
import writeFileAtomic from 'write-file-atomic'

type CacheMap = Record<string, string>

const cachePath = (folderPath: string): string => join(folderPath, 'cache.json')

const cached: Record<string, CacheMap | null> = {}
const getCache = async (folderPath: string): Promise<CacheMap> => {
    if (isNil(cached[folderPath])) {
        const filePath = cachePath(folderPath)
        const cacheExists = await fileSystemUtils.fileExists(filePath)
        if (!cacheExists) {
            await saveToCache(JSON.stringify({}), folderPath, filePath)
        }
        cached[folderPath] = await readCache(filePath) as CacheMap
    }
    const cache = (cached[folderPath] as CacheMap) || {}
    return cache
}
const bloomFilters: Record<string, ScalableBloomFilter | null> = {}
const piecesBloomFilterPath = (folderPath: string): string => join(folderPath, 'pieces-bloom-filter.json')
const getBloomFilter = async (folderPath: string): Promise<ScalableBloomFilter> => {
    if (isNil(bloomFilters[folderPath])) {
        const filePath = piecesBloomFilterPath(folderPath)
        const filterExists = await fileSystemUtils.fileExists(filePath)
        if (!filterExists) {
            const bloomFilter = new ScalableBloomFilter()
            await saveToCache(JSON.stringify(bloomFilter.saveAsJSON()), folderPath, filePath)
        }
        const jsonFile = await readCache(piecesBloomFilterPath(folderPath))
        bloomFilters[folderPath] = ScalableBloomFilter.fromJSON(jsonFile) as ScalableBloomFilter
    }
    const bloomFilter = (bloomFilters[folderPath] as ScalableBloomFilter)
    return bloomFilter
}


export const cacheState = (folderPath: string) => {
    return {
        async getOrSetIfNotExists(cacheAlias: string, state: string): Promise<string | undefined> {
            const bloomFilter = await getBloomFilter(folderPath)
            const exists = bloomFilter.has(cacheAlias)
            if (!exists) {
                await this.setCache(cacheAlias, state)
                return state
            }
            const cache = await getCache(folderPath)
            const cachedState = cache[cacheAlias]
            if (!isNil(cachedState)) {
                return cachedState
            }
            const lockKey = `${folderPath}-${cacheAlias}`
            return fileSystemUtils.runExclusive(folderPath, lockKey, async () => {
                cache[cacheAlias] = state
                bloomFilter.add(cacheAlias)
                await saveToCache(JSON.stringify(cache), folderPath, cachePath(folderPath))
                await saveToCache(JSON.stringify(bloomFilter.saveAsJSON()), folderPath, piecesBloomFilterPath(folderPath))
                return state
            })
        },
        async cacheCheckState(cacheAlias: string): Promise<string | undefined> {
            const bloomFilter = await getBloomFilter(folderPath)
            const mightExist = bloomFilter.has(cacheAlias)
            
            if (!mightExist) {
                return undefined
            }
            const cache = await getCache(folderPath)
            return cache[cacheAlias]
        },
        async setCache(cacheAlias: string, state: string): Promise<void> {
            const lockKey = `${folderPath}-${cacheAlias}`
            return fileSystemUtils.runExclusive(folderPath, lockKey, async () => {
                const bloomFilter = await getBloomFilter(folderPath)
                const cache = await getCache(folderPath)
                bloomFilter.add(cacheAlias)
                cache[cacheAlias] = state
                await saveToCache(JSON.stringify(cache), folderPath, cachePath(folderPath))
                await saveToCache(JSON.stringify(bloomFilter.saveAsJSON()), folderPath, piecesBloomFilterPath(folderPath))
            })
        },
    }
}




async function saveToCache(cache: string, folderPath: string, filePath: string): Promise<void> {
    await fileSystemUtils.threadSafeMkdir(folderPath)
    await writeFileAtomic(filePath, cache, 'utf8')
}

async function readCache(filePath: string): Promise<CacheMap | any> {
    const fileContent = await readFile(filePath, 'utf8')
    return JSON.parse(fileContent)
}