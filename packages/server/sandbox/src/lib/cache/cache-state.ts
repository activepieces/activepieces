import { readFile } from 'node:fs/promises'
import { join } from 'path'
import { isNil } from '@activepieces/core-utils'
import { fileSystemUtils, memoryLock } from '@activepieces/server-utils'
import writeFileAtomic from 'write-file-atomic'

type CacheMap = Record<string, string>

const cachePath = (folderPath: string): string =>
    join(folderPath, 'cache.json')
const MAX_MEMO_CHARS = 16 * 1024 * 1024
const MAX_MEMO_ENTRIES = 512
const memo = new Map<string, MemoEntry>()
let memoChars = 0
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
            return memoryLock.runExclusive({
                key: `cache-save-${folderPath}`,
                fn: async () => {
                    const cacheFromDisk = await readCacheFromFile(folderPath)
                    const valueFromDisk = cacheFromDisk[key]
                    if (!isNil(valueFromDisk) && !cacheMiss(valueFromDisk)) {
                        memoSet({ folderPath, value: cacheFromDisk })
                        return { cacheHit: true, state: valueFromDisk }
                    }
                    const value = await installFn()
                    if (skipSave(value)) {
                        return {
                            cacheHit: false,
                            state: value,
                        }
                    }
                    const freshCache = await cacheState(folderPath).saveCache(
                        key,
                        value,
                    )
                    memoSet({ folderPath, value: freshCache })
                    return {
                        cacheHit: false,
                        state: value,
                    }
                },
            })
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
    const entry = memo.get(folderPath)
    if (!isNil(entry)) {
        memo.delete(folderPath)
        memo.set(folderPath, entry)
        return entry.value
    }
    const value = await readCacheFromFile(folderPath)
    memoSet({ folderPath, value })
    return value
}

function memoSet({ folderPath, value }: MemoSetParams): void {
    const existing = memo.get(folderPath)
    if (!isNil(existing)) {
        memoChars -= existing.chars
        memo.delete(folderPath)
    }
    const chars = Object.entries(value).reduce((total, [key, entryValue]) => total + key.length + entryValue.length, 0)
    if (chars > MAX_MEMO_CHARS) {
        return
    }
    memo.set(folderPath, { value, chars })
    memoChars += chars
    for (const [oldestPath, oldestEntry] of memo) {
        if (memoChars <= MAX_MEMO_CHARS && memo.size <= MAX_MEMO_ENTRIES) {
            break
        }
        if (oldestPath === folderPath) {
            continue
        }
        memo.delete(oldestPath)
        memoChars -= oldestEntry.chars
    }
}

type MemoEntry = {
    value: CacheMap
    chars: number
}

type MemoSetParams = {
    folderPath: string
    value: CacheMap
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
