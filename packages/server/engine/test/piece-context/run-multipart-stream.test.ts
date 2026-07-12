import { multipartStream, MultipartPart, MultipartStreamSink } from '@activepieces/core-utils'

async function* asStream(...buffers: Buffer[]): AsyncGenerator<Buffer> {
    for (const buffer of buffers) {
        yield buffer
    }
}

type SinkState = {
    uploaded: { partNumber: number, length: number }[]
    completedWith: MultipartPart[] | null
    aborts: number
}

function fakeSink(overrides: Partial<MultipartStreamSink<string>> = {}): { sink: MultipartStreamSink<string>, state: SinkState } {
    const state: SinkState = { uploaded: [], completedWith: null, aborts: 0 }
    const sink: MultipartStreamSink<string> = {
        uploadPart: async ({ partNumber, data }) => {
            state.uploaded.push({ partNumber, length: data.length })
            return { etag: `etag-${partNumber}` }
        },
        complete: async ({ parts }) => {
            state.completedWith = parts
            return 'read-url'
        },
        abort: async () => {
            state.aborts += 1
        },
        ...overrides,
    }
    return { sink, state }
}

const neverExceeds = () => new Error('ceiling should not have been hit')

describe('runMultipartStream', () => {
    it('uploads head then rest in order and completes with the collected etags', async () => {
        const { sink, state } = fakeSink()

        const result = await multipartStream.runMultipartStream<string>({
            head: [Buffer.alloc(10), Buffer.alloc(10)],
            rest: asStream(Buffer.alloc(5)),
            ceilingBytes: 1000,
            onCeilingExceeded: neverExceeds,
            sink,
        })

        expect(result).toBe('read-url')
        expect(state.uploaded.map(p => p.partNumber)).toEqual([1, 2, 3])
        expect(state.completedWith).toEqual([
            { partNumber: 1, etag: 'etag-1' },
            { partNumber: 2, etag: 'etag-2' },
            { partNumber: 3, etag: 'etag-3' },
        ])
        expect(state.aborts).toBe(0)
    })

    it('throws the ceiling error and aborts once when the running total exceeds the ceiling', async () => {
        const { sink, state } = fakeSink()

        await expect(
            multipartStream.runMultipartStream<string>({
                head: [Buffer.alloc(60), Buffer.alloc(60)],
                rest: asStream(),
                ceilingBytes: 100,
                onCeilingExceeded: ({ totalBytes, ceilingBytes }) => new Error(`over ${totalBytes} ${ceilingBytes}`),
                sink,
            }),
        ).rejects.toThrow('over 120 100')

        expect(state.uploaded.map(p => p.partNumber)).toEqual([1])
        expect(state.completedWith).toBeNull()
        expect(state.aborts).toBe(1)
    })

    it('aborts and rethrows when a part upload fails, without completing', async () => {
        const { sink, state } = fakeSink({
            uploadPart: async ({ partNumber }) => {
                if (partNumber === 2) {
                    throw new Error('part upload failed')
                }
                return { etag: `etag-${partNumber}` }
            },
        })

        await expect(
            multipartStream.runMultipartStream<string>({
                head: [Buffer.alloc(10), Buffer.alloc(10)],
                rest: asStream(),
                ceilingBytes: 1000,
                onCeilingExceeded: neverExceeds,
                sink,
            }),
        ).rejects.toThrow('part upload failed')

        expect(state.completedWith).toBeNull()
        expect(state.aborts).toBe(1)
    })
})
