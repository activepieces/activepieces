import { ApFile } from '@activepieces/pieces-framework'
import { ExecutionError, ExecutionErrorType } from '@activepieces/shared'
import { Callback, pieceProtocol } from '../../../src/lib/core/piece/piece-protocol'

const noInvoke = async (): Promise<unknown> => {
    throw new Error('not expected')
}

describe('piece protocol', () => {
    it('bridges a function through a marker back to the parent callback', async () => {
        const callbacks = new Map<string, Callback>()
        const encoded = pieceProtocol.encode({ value: { store: { put: async (key: unknown) => `stored:${key}` } }, callbacks })

        expect(JSON.stringify(encoded)).toBe('{"store":{"put":{"__apFn":"0"}}}')

        const decoded = await pieceProtocol.decode({
            value: encoded,
            invoke: async ({ fnId, args }) => callbacks.get(fnId)?.(...args),
        })
        const store = Reflect.get(Object(decoded), 'store')
        expect(await store.put('a')).toBe('stored:a')
    })

    it('round-trips an ApFile and leaves buffers and dates untouched', async () => {
        const callbacks = new Map<string, Callback>()
        const date = new Date('2020-01-01T00:00:00.000Z')
        const value = { file: new ApFile('a.txt', Buffer.from('hello'), 'txt'), raw: Buffer.from('raw'), date }

        const decoded = await pieceProtocol.decode({ value: pieceProtocol.encode({ value, callbacks }), invoke: noInvoke })

        const file = Reflect.get(Object(decoded), 'file')
        expect(file).toBeInstanceOf(ApFile)
        expect(file.base64).toBe(Buffer.from('hello').toString('base64'))
        expect(Reflect.get(Object(decoded), 'raw')).toEqual(Buffer.from('raw'))
        expect(Reflect.get(Object(decoded), 'date')).toEqual(date)
    })

    it('keeps the execution error type across the boundary', () => {
        for (const type of [ExecutionErrorType.ENGINE, ExecutionErrorType.USER]) {
            const restored = pieceProtocol.deserializeError(pieceProtocol.serializeError(new ExecutionError('BoomError', 'boom', type)))

            expect(restored).toBeInstanceOf(ExecutionError)
            expect(restored).toMatchObject({ name: 'BoomError', message: 'boom', type })
        }
    })

    it('keeps http details and the constructor name of a plain piece error', () => {
        class HttpError extends Error {
            constructor(readonly status: number) {
                super('request failed')
            }
        }

        const restored = pieceProtocol.deserializeError(pieceProtocol.serializeError(new HttpError(404)))

        expect(restored).not.toBeInstanceOf(ExecutionError)
        expect(restored).toMatchObject({ name: 'HttpError', message: 'request failed', status: 404 })
    })

    it('drops functions and promises from a result but keeps buffers', () => {
        const transferable = pieceProtocol.toTransferable({
            keep: Buffer.from('bytes'),
            nested: { fn: () => undefined, pending: Promise.resolve(1), value: 2 },
        })

        expect(transferable).toEqual({ keep: Buffer.from('bytes'), nested: { value: 2 } })
    })
})
