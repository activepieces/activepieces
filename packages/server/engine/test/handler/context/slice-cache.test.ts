import { createSliceCache } from '../../../src/lib/handler/context/slice-cache'

const promiseOf = (value: string) => Promise.resolve(value)

describe('sliceCache', () => {
    it('returns cached promises by fileId', async () => {
        const cache = createSliceCache(100)
        const promise = promiseOf('a')
        cache.set({ fileId: 'f1', promise, sizeBytes: 10 })
        expect(cache.get('f1')).toBe(promise)
    })

    it('returns undefined for unknown fileIds', () => {
        const cache = createSliceCache(100)
        expect(cache.get('missing')).toBeUndefined()
    })

    it('evicts the oldest entry when over budget', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'f1', promise: promiseOf('a'), sizeBytes: 60 })
        cache.set({ fileId: 'f2', promise: promiseOf('b'), sizeBytes: 60 })
        expect(cache.get('f1')).toBeUndefined()
        expect(cache.get('f2')).toBeDefined()
    })

    it('evicts as many oldest entries as needed', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'f1', promise: promiseOf('a'), sizeBytes: 40 })
        cache.set({ fileId: 'f2', promise: promiseOf('b'), sizeBytes: 40 })
        cache.set({ fileId: 'f3', promise: promiseOf('c'), sizeBytes: 90 })
        expect(cache.get('f1')).toBeUndefined()
        expect(cache.get('f2')).toBeUndefined()
        expect(cache.get('f3')).toBeDefined()
    })

    it('get refreshes recency so hot entries survive eviction', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'f1', promise: promiseOf('a'), sizeBytes: 40 })
        cache.set({ fileId: 'f2', promise: promiseOf('b'), sizeBytes: 40 })
        cache.get('f1')
        cache.set({ fileId: 'f3', promise: promiseOf('c'), sizeBytes: 40 })
        expect(cache.get('f1')).toBeDefined()
        expect(cache.get('f2')).toBeUndefined()
    })

    it('never stores entries larger than the whole budget', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'huge', promise: promiseOf('a'), sizeBytes: 101 })
        expect(cache.get('huge')).toBeUndefined()
    })

    it('an oversized entry does not evict existing entries', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'f1', promise: promiseOf('a'), sizeBytes: 50 })
        cache.set({ fileId: 'huge', promise: promiseOf('b'), sizeBytes: 500 })
        expect(cache.get('f1')).toBeDefined()
    })

    it('re-setting the same fileId replaces the entry without double-counting', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'f1', promise: promiseOf('a'), sizeBytes: 60 })
        cache.set({ fileId: 'f1', promise: promiseOf('b'), sizeBytes: 60 })
        cache.set({ fileId: 'f2', promise: promiseOf('c'), sizeBytes: 40 })
        expect(cache.get('f1')).toBeDefined()
        expect(cache.get('f2')).toBeDefined()
    })

    it('an entry exactly at budget is kept', () => {
        const cache = createSliceCache(100)
        cache.set({ fileId: 'f1', promise: promiseOf('a'), sizeBytes: 100 })
        expect(cache.get('f1')).toBeDefined()
    })
})
