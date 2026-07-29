import { isNil } from '@activepieces/core-utils'

const DEFAULT_CACHE_BUDGET_MB = 64
const CACHE_BUDGET_BYTES = Number(
    process.env.AP_FLOW_RUN_LOG_SLICE_CACHE_MB ?? DEFAULT_CACHE_BUDGET_MB,
) * 1024 * 1024

export function createSliceCache(budgetBytes: number = CACHE_BUDGET_BYTES): SliceCache {
    const entries = new Map<string, SliceCacheEntry>()
    let totalBytes = 0
    return {
        get: (fileId) => {
            const entry = entries.get(fileId)
            if (isNil(entry)) {
                return undefined
            }
            entries.delete(fileId)
            entries.set(fileId, entry)
            return entry.promise
        },
        set: ({ fileId, promise, sizeBytes }) => {
            const existing = entries.get(fileId)
            if (!isNil(existing)) {
                entries.delete(fileId)
                totalBytes -= existing.sizeBytes
            }
            if (sizeBytes > budgetBytes) {
                return
            }
            entries.set(fileId, { promise, sizeBytes })
            totalBytes += sizeBytes
            for (const [oldestFileId, oldest] of entries) {
                if (totalBytes <= budgetBytes) {
                    break
                }
                entries.delete(oldestFileId)
                totalBytes -= oldest.sizeBytes
            }
        },
    }
}

type SliceCacheEntry = {
    promise: Promise<unknown>
    sizeBytes: number
}

export type SliceCache = {
    get(fileId: string): Promise<unknown> | undefined
    set(params: { fileId: string, promise: Promise<unknown>, sizeBytes: number }): void
}
