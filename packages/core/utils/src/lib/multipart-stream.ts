// Small helpers for consuming inbound byte streams: normalizing a web
// ReadableStream to an async iterable, and buffering a stream whole under a
// byte ceiling (the honest fallback when object storage isn't available).
async function bufferRemaining({ head, rest, maxSizeBytes, onOverflow }: BufferRemainingParams): Promise<Buffer> {
    const buffers: Uint8Array[] = [...head]
    let totalBytes = head.reduce((sum, buffer) => sum + buffer.length, 0)
    if (totalBytes > maxSizeBytes) {
        throw onOverflow(totalBytes)
    }
    for await (const part of rest) {
        totalBytes += part.length
        if (totalBytes > maxSizeBytes) {
            throw onOverflow(totalBytes)
        }
        buffers.push(part)
    }
    return Buffer.concat(buffers)
}

function toAsyncIterable(stream: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>): AsyncIterable<Uint8Array> {
    if (!('getReader' in stream)) {
        return stream
    }
    return (async function* () {
        const reader = stream.getReader()
        try {
            for (;;) {
                const { done, value } = await reader.read()
                if (done) {
                    return
                }
                yield value
            }
        }
        finally {
            reader.releaseLock()
        }
    })()
}

export const multipartStream = {
    bufferRemaining,
    toAsyncIterable,
}

type BufferRemainingParams = {
    head: Uint8Array[]
    rest: AsyncIterable<Uint8Array>
    maxSizeBytes: number
    onOverflow: (totalBytes: number) => Error
}
