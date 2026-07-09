import { ApEdition } from '@activepieces/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { reindexJobId, reindexLockKey, shouldSkipReindexOnCloud } from '../../../../src/app/tool-search/tool-search-reindex.job'

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

describe('shouldSkipReindexOnCloud — cloud never falls back to the oldest platform', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('skips on cloud when AP_OPENAI_API_KEY is unset (no oldest-platform fallback)', () => {
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)
        vi.spyOn(system, 'get').mockReturnValue(undefined)

        expect(shouldSkipReindexOnCloud()).toBe(true)
    })

    it('does not skip on cloud when AP_OPENAI_API_KEY is set (env funds it)', () => {
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)
        vi.spyOn(system, 'get').mockImplementation((prop) =>
            (prop === AppSystemProp.OPENAI_API_KEY ? 'sk-env-key' : undefined),
        )

        expect(shouldSkipReindexOnCloud()).toBe(false)
    })

    it('does not skip on self-hosted editions without the env key (keeps the oldest-platform fallback)', () => {
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.ENTERPRISE)
        vi.spyOn(system, 'get').mockReturnValue(undefined)

        expect(shouldSkipReindexOnCloud()).toBe(false)
    })
})
