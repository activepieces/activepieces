import { createGenerationMemo } from '../../../../src/app/pieces/metadata/utils/generation-memo'

describe('generation memo', () => {
    it('does not serve a load that finishes after the generation moved on', async () => {
        const clock = { generation: 1 }
        const memo = createGenerationMemo<string>({ currentGeneration: () => clock.generation })
        const stale = deferred<string>()

        const startedBefore = memo.get({ key: 'de', load: () => stale.promise })
        clock.generation = 2
        const startedAfter = memo.get({ key: 'de', load: async () => 'fresh' })
        stale.resolve('stale')

        await expect(startedBefore).resolves.toBe('stale')
        await expect(startedAfter).resolves.toBe('fresh')
        await expect(memo.get({ key: 'de', load: async () => 'unused' })).resolves.toBe('fresh')
    })

    it('shares one load between concurrent callers', async () => {
        const memo = createGenerationMemo<string>({ currentGeneration: () => 1 })
        const load = vi.fn(async () => 'value')

        const results = await Promise.all(Array.from({ length: 5 }, () => memo.get({ key: 'de', load })))

        expect(results).toEqual(Array(5).fill('value'))
        expect(load).toHaveBeenCalledTimes(1)
    })

    it('keeps keys apart', async () => {
        const memo = createGenerationMemo<string>({ currentGeneration: () => 1 })

        await memo.get({ key: 'de', load: async () => 'german' })
        await memo.get({ key: 'fr', load: async () => 'french' })

        await expect(memo.get({ key: 'de', load: async () => 'unused' })).resolves.toBe('german')
        await expect(memo.get({ key: 'fr', load: async () => 'unused' })).resolves.toBe('french')
    })

    it('loads again after a failed load', async () => {
        const memo = createGenerationMemo<string>({ currentGeneration: () => 1 })

        await expect(memo.get({ key: 'de', load: async () => {
            throw new Error('database unavailable')
        } })).rejects.toThrow('database unavailable')

        await expect(memo.get({ key: 'de', load: async () => 'recovered' })).resolves.toBe('recovered')
    })

    it('keeps the newer entry when a stale load fails late', async () => {
        const clock = { generation: 1 }
        const memo = createGenerationMemo<string>({ currentGeneration: () => clock.generation })
        const stale = deferred<string>()
        const load = vi.fn(async () => 'fresh')

        const startedBefore = memo.get({ key: 'de', load: () => stale.promise })
        clock.generation = 2
        await memo.get({ key: 'de', load })
        stale.reject(new Error('late failure'))

        await expect(startedBefore).rejects.toThrow('late failure')
        await expect(memo.get({ key: 'de', load })).resolves.toBe('fresh')
        expect(load).toHaveBeenCalledTimes(1)
    })
})

function deferred<T>(): Deferred<T> {
    const settle: Omit<Deferred<T>, 'promise'> = { resolve: () => undefined, reject: () => undefined }
    const promise = new Promise<T>((resolve, reject) => {
        settle.resolve = resolve
        settle.reject = reject
    })
    return { promise, ...settle }
}

type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (error: Error) => void
}
