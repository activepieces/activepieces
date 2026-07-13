import { tryCatch } from './try-catch'

const PART_SIZE_BYTES = 8 * 1024 * 1024

async function* chunkIntoParts(source: AsyncIterable<Uint8Array>, partSizeBytes: number): AsyncGenerator<Buffer, void, undefined> {
    let pending: Buffer[] = []
    let pendingBytes = 0
    for await (const chunk of source) {
        pending.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
        pendingBytes += chunk.byteLength
        while (pendingBytes >= partSizeBytes) {
            const whole = Buffer.concat(pending)
            yield whole.subarray(0, partSizeBytes)
            const rest = whole.subarray(partSizeBytes)
            pending = rest.length > 0 ? [rest] : []
            pendingBytes = rest.length
        }
    }
    if (pendingBytes > 0) {
        yield Buffer.concat(pending)
    }
}

async function bufferRemaining({ head, rest, maxSizeBytes, onOverflow }: BufferRemainingParams): Promise<Buffer> {
    const buffers = [...head]
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
    if (Symbol.asyncIterator in stream) {
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

// Drives an already-begun multipart upload: uploads head parts (1..n) then the
// rest, enforcing a running-total ceiling, and on any throw best-effort aborts
// before rethrowing. The sink supplies the transport (presigned PUT in the
// engine, direct S3 in the API) and the completion result R.
async function runMultipartStream<R>({ head, rest, ceilingBytes, onCeilingExceeded, sink }: RunMultipartStreamParams<R>): Promise<R> {
    const uploadedParts: { partNumber: number, etag: string }[] = []
    let totalBytes = 0
    const uploadOnePart = async (data: Buffer): Promise<void> => {
        totalBytes += data.length
        if (totalBytes > ceilingBytes) {
            throw onCeilingExceeded({ totalBytes, ceilingBytes })
        }
        const partNumber = uploadedParts.length + 1
        const { etag } = await sink.uploadPart({ partNumber, data })
        uploadedParts.push({ partNumber, etag })
    }
    try {
        for (const part of head) {
            await uploadOnePart(part)
        }
        for await (const part of rest) {
            await uploadOnePart(part)
        }
        return await sink.complete({ parts: uploadedParts })
    }
    catch (error) {
        await tryCatch(() => sink.abort())
        throw error
    }
}

export const multipartStream = {
    PART_SIZE_BYTES,
    chunkIntoParts,
    bufferRemaining,
    toAsyncIterable,
    runMultipartStream,
}

export type MultipartPart = {
    partNumber: number
    etag: string
}

export type MultipartStreamSink<R> = {
    uploadPart: (params: { partNumber: number, data: Buffer }) => Promise<{ etag: string }>
    complete: (params: { parts: MultipartPart[] }) => Promise<R>
    abort: () => Promise<void>
}

type RunMultipartStreamParams<R> = {
    head: Buffer[]
    rest: AsyncIterable<Buffer>
    ceilingBytes: number
    onCeilingExceeded: (params: { totalBytes: number, ceilingBytes: number }) => Error
    sink: MultipartStreamSink<R>
}

type BufferRemainingParams = {
    head: Buffer[]
    rest: AsyncIterable<Buffer>
    maxSizeBytes: number
    onOverflow: (totalBytes: number) => Error
}
