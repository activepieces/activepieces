import { describe, expect, it } from 'vitest'
import { pendingCacheRemovals } from '../../../src/lib/cache/pending-cache-removals'

describe('pendingCacheRemovals', () => {
    it('resolves false immediately for a path with no tracked removal', async () => {
        await expect(pendingCacheRemovals.settle('/never/tracked')).resolves.toBe(false)
    })

    it('waits for the tracked removal to finish before resolving true', async () => {
        let resolved = false
        let resolveRemoval: () => void = () => undefined
        const removal = new Promise<void>((resolve) => {
            resolveRemoval = () => {
                resolved = true
                resolve()
            }
        })

        pendingCacheRemovals.track('/tracked', removal)
        const settled = pendingCacheRemovals.settle('/tracked')

        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(resolved).toBe(false)

        resolveRemoval()
        await expect(settled).resolves.toBe(true)
        expect(resolved).toBe(true)
    })

    it('forgets a removal once untracked, even if the path is reused', async () => {
        const removal = Promise.resolve()
        pendingCacheRemovals.track('/reused', removal)
        await pendingCacheRemovals.settle('/reused')
        pendingCacheRemovals.untrack('/reused')

        await expect(pendingCacheRemovals.settle('/reused')).resolves.toBe(false)
    })
})
