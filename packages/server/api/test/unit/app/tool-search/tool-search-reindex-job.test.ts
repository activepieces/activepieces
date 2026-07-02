import { describe, expect, it } from 'vitest'
import { reindexJobId, reindexLockKey } from '../../../../src/app/tool-search/tool-search-reindex.job'

describe('tool-search reindex job — dedup + lock keys', () => {
    it('gives the global reindex one stable jobId so repeat enqueues collapse to a single pending job', () => {
        expect(reindexJobId({ type: 'all' })).toBe(reindexJobId({ type: 'all' }))
    })

    it('gives each platform a distinct jobId, separate from the global one', () => {
        const a = reindexJobId({ type: 'platform', platformId: 'platform-a' })
        const b = reindexJobId({ type: 'platform', platformId: 'platform-b' })
        expect(a).not.toBe(b)
        expect(a).not.toBe(reindexJobId({ type: 'all' }))
        // Stable for the same platform → a burst of installs dedups to one pending job.
        expect(a).toBe(reindexJobId({ type: 'platform', platformId: 'platform-a' }))
    })

    it('uses one global lock key for every scope so a global and a scoped reconcile never run concurrently', () => {
        expect(reindexLockKey({ type: 'all' })).toBe(reindexLockKey({ type: 'platform', platformId: 'platform-a' }))
        expect(reindexLockKey({ type: 'platform', platformId: 'platform-a' })).toBe(reindexLockKey({ type: 'platform', platformId: 'platform-b' }))
    })
})
