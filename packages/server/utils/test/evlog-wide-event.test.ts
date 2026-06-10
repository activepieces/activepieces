import { describe, it, expect, vi, beforeEach } from 'vitest'
import { wideEvent } from '../src/wide-event'
import type { RequestLogger } from 'evlog'

function makeMockLogger(): RequestLogger & {
    _sets: Record<string, unknown>[]
    _infos: [string, Record<string, unknown>?][]
    _errors: [Error | string, Record<string, unknown>?][]
    emit: () => null
} {
    const _sets: Record<string, unknown>[] = []
    const _infos: [string, Record<string, unknown>?][] = []
    const _errors: [Error | string, Record<string, unknown>?][] = []
    return {
        _sets,
        _infos,
        _errors,
        set(fields) { _sets.push(fields as Record<string, unknown>) },
        setLevel: vi.fn(),
        error(err, ctx?) { _errors.push([err, ctx as Record<string, unknown>]) },
        info(msg, ctx?) { _infos.push([msg, ctx as Record<string, unknown>]) },
        warn: vi.fn(),
        emit: () => null,
        getContext: () => ({}),
    }
}

describe('wideEvent', () => {
    beforeEach(() => {
        // no global state to reset — ALS is scoped per run()
    })

    it('current() returns undefined outside of a run()', () => {
        expect(wideEvent.current()).toBeUndefined()
    })

    it('set() is a no-op outside of a run()', () => {
        // Should not throw
        expect(() => wideEvent.set({ foo: 'bar' })).not.toThrow()
    })

    it('run() makes the logger accessible via current()', () => {
        const logger = makeMockLogger()
        wideEvent.run({
            logger,
            fn: () => {
                expect(wideEvent.current()).toBe(logger)
            },
        })
    })

    it('set() calls logger.set() within a run()', () => {
        const logger = makeMockLogger()
        wideEvent.run({
            logger,
            fn: () => {
                wideEvent.set({ requestId: 'abc' })
            },
        })
        expect(logger._sets).toHaveLength(1)
        expect(logger._sets[0]).toEqual({ requestId: 'abc' })
    })

    it('error() wraps a non-Error value', () => {
        const logger = makeMockLogger()
        wideEvent.run({
            logger,
            fn: () => {
                wideEvent.error('something went wrong')
            },
        })
        expect(logger._errors).toHaveLength(1)
        const [err] = logger._errors[0]
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe('something went wrong')
    })

    it('error() passes an existing Error directly', () => {
        const logger = makeMockLogger()
        const original = new Error('original')
        wideEvent.run({
            logger,
            fn: () => {
                wideEvent.error(original)
            },
        })
        expect(logger._errors[0][0]).toBe(original)
    })

    it('error() is a no-op outside a run()', () => {
        expect(() => wideEvent.error(new Error('boom'))).not.toThrow()
    })

    it('timed() records duration and returns result', async () => {
        const logger = makeMockLogger()
        const result = await wideEvent.run({
            logger,
            fn: () => wideEvent.timed({
                name: 'db',
                fn: async () => 42,
            }),
        })
        expect(result).toBe(42)
        const timingSet = logger._sets.find((s) => s['timings'] !== undefined)
        expect(timingSet).toBeDefined()
        expect((timingSet?.['timings'] as Record<string, unknown>)?.['dbMs']).toBeTypeOf('number')
    })

    it('timed() records timing and rethrows on error', async () => {
        const logger = makeMockLogger()
        await expect(
            wideEvent.run({
                logger,
                fn: () => wideEvent.timed({
                    name: 'slow',
                    fn: async () => {
                        throw new Error('timed failure')
                    },
                }),
            }),
        ).rejects.toThrow('timed failure')

        const timingSet = logger._sets.find((s) => s['timings'] !== undefined)
        expect(timingSet).toBeDefined()
        expect((timingSet?.['timings'] as Record<string, unknown>)?.['slowMs']).toBeTypeOf('number')
    })

    it('timed() is a no-op outside a run() (no ambient logger)', async () => {
        const result = await wideEvent.timed({ name: 'test', fn: async () => 'val' })
        expect(result).toBe('val')
    })
})
