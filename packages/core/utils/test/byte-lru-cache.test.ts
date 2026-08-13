import { createByteLruCache } from '../src/lib/byte-lru-cache'

const promiseOf = (value: string) => Promise.resolve(value)

describe('byteLruCache', () => {
    it('returns cached values by key', async () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        const promise = promiseOf('a')
        cache.set({ key: 'f1', value: promise, sizeBytes: 10 })
        expect(cache.get('f1')).toBe(promise)
    })

    it('returns undefined for unknown keys', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        expect(cache.get('missing')).toBeUndefined()
    })

    it('evicts the oldest entry when over budget', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'f1', value: promiseOf('a'), sizeBytes: 60 })
        cache.set({ key: 'f2', value: promiseOf('b'), sizeBytes: 60 })
        expect(cache.get('f1')).toBeUndefined()
        expect(cache.get('f2')).toBeDefined()
    })

    it('evicts as many oldest entries as needed', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'f1', value: promiseOf('a'), sizeBytes: 40 })
        cache.set({ key: 'f2', value: promiseOf('b'), sizeBytes: 40 })
        cache.set({ key: 'f3', value: promiseOf('c'), sizeBytes: 90 })
        expect(cache.get('f1')).toBeUndefined()
        expect(cache.get('f2')).toBeUndefined()
        expect(cache.get('f3')).toBeDefined()
    })

    it('get refreshes recency so hot entries survive eviction', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'f1', value: promiseOf('a'), sizeBytes: 40 })
        cache.set({ key: 'f2', value: promiseOf('b'), sizeBytes: 40 })
        cache.get('f1')
        cache.set({ key: 'f3', value: promiseOf('c'), sizeBytes: 40 })
        expect(cache.get('f1')).toBeDefined()
        expect(cache.get('f2')).toBeUndefined()
    })

    it('never stores entries larger than the whole budget', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'huge', value: promiseOf('a'), sizeBytes: 101 })
        expect(cache.get('huge')).toBeUndefined()
    })

    it('an oversized entry does not evict existing entries', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'f1', value: promiseOf('a'), sizeBytes: 50 })
        cache.set({ key: 'huge', value: promiseOf('b'), sizeBytes: 500 })
        expect(cache.get('f1')).toBeDefined()
    })

    it('re-setting the same fileId replaces the entry without double-counting', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'f1', value: promiseOf('a'), sizeBytes: 60 })
        cache.set({ key: 'f1', value: promiseOf('b'), sizeBytes: 60 })
        cache.set({ key: 'f2', value: promiseOf('c'), sizeBytes: 40 })
        expect(cache.get('f1')).toBeDefined()
        expect(cache.get('f2')).toBeDefined()
    })

    it('an entry exactly at budget is kept', () => {
        const cache = createByteLruCache<Promise<string>>({ budgetBytes: 100 })
        cache.set({ key: 'f1', value: promiseOf('a'), sizeBytes: 100 })
        expect(cache.get('f1')).toBeDefined()
    })
})
