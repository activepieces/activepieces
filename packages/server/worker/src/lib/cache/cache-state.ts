import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { fileSystemUtils } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'

type CacheMap = Record<string, string>

const cachePath = (folderPath: string): string =>
    join(folderPath, 'cache.json')
const cached: Record<string, CacheMap | null> = {}
export const NO_SAVE_GUARD = (_: string): boolean => false

export const cacheState = (folderPath: string) => {
    return {
        async getOrSetCache({
            cacheMiss,
            key,
            installFn,
            skipSave,
        }: CacheStateParams): Promise<CacheResult> {
            const cache = await readCacheFromMemory(folderPath)
            const value = cache[key] as string | null
            if (!isNil(value) && !cacheMiss(value)) {
                return {
                    cacheHit: true,
                    state: value,
                }
            }
            return fileSystemUtils.runExclusive(
                folderPath,
                'cache-save',
                async () => {
                    const valueFromDisk = await readKeyFromDisk(key, folderPath)
                    if (!isNil(valueFromDisk) && !cacheMiss(valueFromDisk)) {
                        return { cacheHit: true, state: valueFromDisk }
                    }
                    const value = await installFn()
                    if (skipSave(value)) {
                        return {
                            cacheHit: false,
                            state: null,
                        }
                    }
                    const freshCache = await cacheState(folderPath).saveCache(key, value)
                    cached[folderPath] = freshCache
                    return {
                        cacheHit: false,
                        state: value,
                    }
                },
            )
        },
        saveCache: async (key: string, value: string): Promise<CacheMap> => {
            await fileSystemUtils.threadSafeMkdir(folderPath)
            const cacheFilePath = cachePath(folderPath)
            const freshCache = await readCacheFromFile(folderPath)
            freshCache[key] = value
            await writeFileAtomic(cacheFilePath, JSON.stringify(freshCache), 'utf8')
            return freshCache
        },
    }
}

async function readKeyFromDisk(
    key: string,
    folderPath: string,
): Promise<string | null> {
    const cache = await readCacheFromFile(folderPath)
    return cache[key]
}

async function readCacheFromFile(folderPath: string): Promise<CacheMap> {
    const filePath = cachePath(folderPath)
    const fileExists = await fileSystemUtils.fileExists(filePath)
    if (!fileExists) {
        return {}
    }
    const fileContent = await readFile(filePath, 'utf8')
    return JSON.parse(fileContent)
}

async function readCacheFromMemory(folderPath: string): Promise<CacheMap> {
    if (isNil(cached[folderPath])) {
        cached[folderPath] = await readCacheFromFile(folderPath)
    }
    return cached[folderPath]
}


type CacheResult = {
    cacheHit: boolean
    state: string | null
}

type CacheStateParams = {
    key: string
    cacheMiss: (value: string) => boolean
    installFn: () => Promise<string>
    skipSave: (value: string) => boolean
}
