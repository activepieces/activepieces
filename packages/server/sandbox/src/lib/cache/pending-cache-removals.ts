import { isNil } from '@activepieces/core-utils'

// Shared across both eviction passes (code-cache-eviction.ts) so that provisioning
// (local-execution-cache.ts) can wait out ANY in-flight removal of a directory it is about to use,
// regardless of which pass started the removal, instead of racing a cache hit against a recursive
// rm that is still deleting the files underneath it.
export const pendingCacheRemovals = {
    track(dirPath: string, removal: Promise<unknown>): void {
        pendingRemovals.set(dirPath, removal)
    },

    untrack(dirPath: string): void {
        pendingRemovals.delete(dirPath)
    },

    async settle(dirPath: string): Promise<boolean> {
        const pending = pendingRemovals.get(dirPath)
        if (isNil(pending)) {
            return false
        }
        await pending
        return true
    },
}

const pendingRemovals = new Map<string, Promise<unknown>>()
